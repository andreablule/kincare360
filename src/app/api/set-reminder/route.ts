import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VAPI tool endpoint — Lily calls this to set a one-time reminder for a client
// Saves to DB → picked up by /api/send-reminders cron every minute

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

      // Build the date in UTC but representing ET
      // Get current ET time for comparison
      const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      
      // Create reminder date in ET
      reminderDate = new Date(etNow);
      reminderDate.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (reminderDate <= etNow) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      // Convert back to UTC for storage
      // ET offset: calculate difference between UTC and our ET-based date
      const utcOffset = now.getTime() - etNow.getTime();
      reminderDate = new Date(reminderDate.getTime() + utcOffset);
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

    // Save reminder to database — cron picks it up at the right time
    await prisma.reminder.create({
      data: {
        patientId: patient.id,
        message: reminderMessage,
        scheduledAt: reminderDate,
        status: "pending",
      },
    });

    console.log(`[set-reminder] Saved reminder for ${patient.firstName} at ${formattedTime}: ${reminderMessage}`);

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
