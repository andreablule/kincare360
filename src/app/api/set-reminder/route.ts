import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VAPI_KEY = "3e6bdfb6-fc6f-4c60-a584-16cfa60e6846";
const PHONE_NUMBER_ID = "8354bde3-c67c-4316-b181-95c227479b58";

// VAPI tool endpoint — Lily calls this to set a one-time reminder for a client
// Lily provides: message (what to remind), reminderTime (when to call), patientPhone

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Parse VAPI tool call
    let args: any = {};
    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }
    if (!args.reminderMessage) args = body;

    const { reminderMessage, reminderTime } = args;

    if (!reminderMessage || !reminderTime) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I need both what to remind you about and when. Could you give me those details?" }]
      });
    }

    // Look up patient
    const callerPhone = (body.message?.call?.customer?.number || "").replace(/\D/g, "").slice(-10);
    let patient: any = null;
    if (callerPhone) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: callerPhone } },
      });
    }

    if (!patient) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I wasn't able to find your account to set a reminder. Please try again." }]
      });
    }

    // Parse the reminder time — handle natural language like "6 PM", "in 2 hours", "at 3:30"
    const now = new Date();
    let reminderDate: Date | null = null;

    // Try to parse time
    const timeMatch = reminderTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || "0");
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;

      // Use Eastern time
      const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      reminderDate = new Date(et);
      reminderDate.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (reminderDate <= et) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
    }

    // Handle "in X minutes/hours"
    const inMatch = reminderTime.match(/in\s+(\d+)\s+(minute|hour)/i);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2].toLowerCase();
      reminderDate = new Date(now.getTime() + amount * (unit === "hour" ? 3600000 : 60000));
    }

    if (!reminderDate) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I didn't quite catch when you want the reminder. Could you say a time like '6 PM' or 'in 2 hours'?" }]
      });
    }

    const msUntilReminder = reminderDate.getTime() - now.getTime();
    const formattedTime = reminderDate.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const formattedDate = reminderDate.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const patientFirstName = patient.firstName;
    const patientPhone = patient.phone;

    // Schedule the reminder call
    setTimeout(async () => {
      try {
        await fetch("https://api.vapi.ai/call/phone", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${VAPI_KEY}` },
          body: JSON.stringify({
            phoneNumberId: PHONE_NUMBER_ID,
            customer: { number: `+1${patientPhone}` },
            assistant: {
              name: "Lily - Reminder",
              model: {
                provider: "openai",
                model: "gpt-4o-mini",
                messages: [{
                  role: "system",
                  content: `You are Lily from KinCare360 calling ${patientFirstName} with a reminder they requested. The reminder is: "${reminderMessage}". Call them by name, deliver the reminder warmly, ask if they need anything else, then say goodbye and end the call.`
                }],
              },
              voice: { provider: "11labs", voiceId: "paula" },
              firstMessage: `Hi ${patientFirstName}, this is Lily from KinCare360. You asked me to remind you: ${reminderMessage}`,
              endCallPhrases: ["have a wonderful day", "have a great day", "goodbye", "bye", "take care"],
              serverUrl: "https://www.kincare360.com/api/call-logs",
              backgroundSound: "off",
              backgroundDenoisingEnabled: true,
              backchannelingEnabled: false,
            },
          }),
        });
        console.log(`[set-reminder] Reminder fired for ${patientFirstName}: ${reminderMessage}`);
      } catch (e) {
        console.error("[set-reminder] Failed to fire reminder:", e);
      }
    }, msUntilReminder);

    console.log(`[set-reminder] Reminder set for ${patientFirstName} at ${formattedTime} (${msUntilReminder}ms): ${reminderMessage}`);

    const isToday = reminderDate.toDateString() === new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" })).toDateString();

    return NextResponse.json({
      results: [{
        toolCallId: toolCall?.id || "",
        result: `I'll remind you ${isToday ? "today" : formattedDate} at ${formattedTime}. "${reminderMessage}"`
      }]
    });

  } catch (error) {
    console.error("[set-reminder] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I had trouble setting that reminder. Could you try again?" }]
    });
  }
}
