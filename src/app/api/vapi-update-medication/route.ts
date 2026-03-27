import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

// Normalize natural time strings to HH:MM 24-hour format
function parseTime(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  // Already HH:MM 24-hour
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1]);
    const m = parseInt(match24[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }

  // Natural formats: "8 AM", "8:30 PM", "noon", "midnight"
  if (trimmed === "noon") return "12:00";
  if (trimmed === "midnight") return "00:00";

  const matchNatural = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (matchNatural) {
    let h = parseInt(matchNatural[1]);
    const m = parseInt(matchNatural[2] || "0");
    const period = matchNatural[3];
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (period === "am" && h === 12) h = 0;
    if (period === "pm" && h !== 12) h += 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Auth: check VAPI server secret header
    const secret = process.env.VAPI_AUTH_SECRET;
    if (secret) {
      const headerSecret =
        req.headers.get("x-vapi-secret") ||
        req.headers.get("authorization")?.replace("Bearer ", "");
      if (headerSecret !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();

    // Extract tool call arguments from VAPI server tool format
    let args: Record<string, any> = {};
    let toolCallId = "";

    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      args =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      toolCallId = toolCall.id || "";
    }

    // Fallback: direct POST body
    if (!Object.keys(args).length) {
      args = body.message?.functionCall?.parameters || body;
    }

    const { medicationName, newTime, patientPhone } = args;

    if (!medicationName || !newTime) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result:
              "I need both the medication name and the new reminder time to make this change.",
          },
        ],
      });
    }

    // Parse the time
    const parsedTime = parseTime(newTime);
    if (!parsedTime) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result: `I couldn't understand the time "${newTime}". Please use a format like "8 AM", "2:30 PM", or "14:30".`,
          },
        ],
      });
    }

    // Get caller phone — from args, or from VAPI call object
    const customerPhone =
      patientPhone ||
      body.message?.call?.customer?.number ||
      body.call?.customer?.number ||
      "";

    const digits = customerPhone.replace(/\D/g, "").slice(-10);
    if (!digits) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result:
              "I couldn't identify the patient. Please provide the patient's phone number.",
          },
        ],
      });
    }

    // Find patient by phone (direct or via family member)
    let patient = await prisma.patient.findFirst({
      where: { phone: { contains: digits } },
      include: { medications: true },
    });

    if (!patient) {
      // Check if caller is a family member
      const familyMember = await prisma.familyMember.findFirst({
        where: { phone: { contains: digits } },
        include: { patient: { include: { medications: true } } },
      });
      if (familyMember?.patient) {
        patient = familyMember.patient;
      }
    }

    if (!patient) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result:
              "I couldn't find a patient record for this phone number.",
          },
        ],
      });
    }

    // Find the medication by name (case-insensitive partial match)
    const medication = patient.medications.find(
      (m: any) =>
        m.name.toLowerCase().includes(medicationName.toLowerCase()) ||
        medicationName.toLowerCase().includes(m.name.toLowerCase())
    );

    if (!medication) {
      const medNames = patient.medications.map((m: any) => m.name).join(", ");
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result: `I couldn't find a medication matching "${medicationName}" for ${patient.firstName}. Their medications on file are: ${medNames || "none"}.`,
          },
        ],
      });
    }

    // Update the medication reminder time
    await prisma.medication.update({
      where: { id: medication.id },
      data: { reminderTime: parsedTime },
    });

    const hour = parseInt(parsedTime.split(":")[0]);
    const min = parsedTime.split(":")[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    const friendlyTime = min === "00" ? `${hour12} ${ampm}` : `${hour12}:${min} ${ampm}`;

    console.log(
      `[vapi-update-medication] Updated ${medication.name} reminder to ${parsedTime} for ${patient.firstName}`
    );

    return NextResponse.json({
      results: [
        {
          toolCallId,
          result: `Done! I've updated the reminder time for ${medication.name} to ${friendlyTime} for ${patient.firstName}.`,
        },
      ],
    });
  } catch (err) {
    console.error("[vapi-update-medication] Error:", err);
    return NextResponse.json({
      results: [
        {
          toolCallId: "",
          result:
            "There was an error updating the medication reminder. I'll flag this for the care team.",
        },
      ],
    });
  }
}
