import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VAPI server tool handler: Lily updates patient profile fields during a call
// Supports updating medicationReminderTime, gender, preferredCallTime, checkInDays, preferredLanguage, phone

export async function POST(req: NextRequest) {
  try {
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

    // Fallback: legacy function call format
    if (!Object.keys(args).length) {
      args = body.message?.functionCall?.parameters || body;
    }

    // Get caller phone to identify patient
    const customerPhone =
      body.message?.call?.customer?.number ||
      body.call?.customer?.number ||
      args.callerPhone ||
      "";

    const digits = customerPhone.replace(/\D/g, "").slice(-10);
    if (!digits) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result: "I couldn't identify the caller to update their profile.",
          },
        ],
      });
    }

    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: digits } },
    });

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

    // Build update data — only include fields that were provided
    const updateData: Record<string, any> = {};
    const updates: string[] = [];

    if (args.medicationReminderTime) {
      // Accept comma-separated times like "09:20,12:00,20:00"
      updateData.medicationReminderTime = args.medicationReminderTime;
      updates.push(`medication reminder times to ${args.medicationReminderTime}`);
    }

    if (args.gender) {
      updateData.gender = args.gender;
      updates.push(`gender to ${args.gender}`);
    }

    if (args.preferredCallTime) {
      updateData.preferredCallTime = args.preferredCallTime;
      updates.push(`preferred call time to ${args.preferredCallTime}`);
    }

    if (args.checkInDays) {
      updateData.checkInDays = args.checkInDays;
      updates.push(`check-in days to ${args.checkInDays}`);
    }

    if (args.preferredLanguage) {
      updateData.preferredLanguage = args.preferredLanguage;
      updates.push(`preferred language to ${args.preferredLanguage}`);
    }

    if (args.phone) {
      // Store digits only
      const cleanPhone = args.phone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length === 10) {
        updateData.phone = cleanPhone;
        updates.push(`phone number to ${cleanPhone}`);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result: "No fields provided to update.",
          },
        ],
      });
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: updateData,
    });

    const summary = updates.join(" and ");
    console.log(
      `[vapi-update-patient] Updated ${patient.firstName}: ${summary}`
    );

    return NextResponse.json({
      results: [
        {
          toolCallId,
          result: `Successfully updated ${summary} for ${patient.firstName}.`,
        },
      ],
    });
  } catch (err) {
    console.error("[vapi-update-patient] Error:", err);
    return NextResponse.json({
      results: [
        {
          toolCallId: "",
          result: "There was an error updating the profile. Please try again.",
        },
      ],
    });
  }
}
