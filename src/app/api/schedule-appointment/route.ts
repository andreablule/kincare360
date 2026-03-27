import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VAPI tool endpoint — Lily calls this to schedule an appointment on behalf of a client
// Lily provides: providerName, providerPhone, patientPhone (to look up), preferredTime, reason
// This triggers an outbound VAPI call to the provider's office, then a callback to the patient

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // VAPI sends tool call arguments in message.toolCallList[0].function.arguments
    let args: any = {};
    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }
    // Fallback: direct POST
    if (!args.providerPhone) {
      args = body;
    }

    const { providerName, providerPhone, patientPhone, preferredTime, reason } = args;

    if (!providerPhone) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I need the provider's phone number to schedule. Could you give me their number?" }]
      });
    }

    // Look up patient by phone
    const digits = (patientPhone || body.message?.call?.customer?.number || "").replace(/\D/g, "").slice(-10);
    let patient: any = null;
    if (digits) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: digits } },
        include: { user: { select: { plan: true } } },
      });
    }

    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "the patient";
    const patientDob = patient?.dob || "on file";
    const insurance = patient?.insuranceCompany 
      ? `${patient.insuranceCompany}${patient.insuranceMemberId ? `, member ID ${patient.insuranceMemberId}` : ""}`
      : null;
    const callbackPhone = patient?.phone || digits;

    const providerDigits = providerPhone.replace(/\D/g, "").slice(-10);
    if (providerDigits.length !== 10) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "That phone number doesn't look right. Could you give me the full 10-digit number?" }]
      });
    }

    // Build the outbound call system prompt — sound like a real human care coordinator
    const systemPrompt = `You are Lily, a care coordinator with KinCare360. You are calling ${providerName || "a doctor's office"} to schedule an appointment for your client.

YOUR CLIENT:
- Name: ${patientName}
- Date of Birth: ${patientDob}
${insurance ? `- Insurance: ${insurance}` : "- Insurance: patient will bring their card to the appointment"}
- This is a ${patient ? "new" : ""} patient appointment
- Preferred time: ${preferredTime || "the earliest available"}
- Reason: ${reason || "general consultation"}

HOW TO ACT:
- Sound natural and professional, like a real person making a call
- Introduce yourself: "Hi, my name is Lily. I'm a care coordinator calling on behalf of one of my clients to schedule an appointment."
- If asked who you work for: "I'm with KinCare360, we're a care coordination service that helps families manage healthcare for their elderly loved ones."
- Provide the patient's name and date of birth when asked
- If they ask about insurance: provide it if you have it, otherwise say "the patient will bring their insurance information to the appointment"
- Ask for the earliest available appointment, or the client's preferred time
- Confirm: appointment date, time, doctor name, any prep instructions
- If they can't schedule now: ask for a callback number or when to call back
- Thank them warmly
- If you reach voicemail: leave a message with the patient name, your name Lily, and callback number 812-515-5252
- NEVER say you are an AI. You are Lily, a care coordinator.`;

    // Make the outbound VAPI call to the provider
    const vapiBody = {
      phoneNumberId: "8354bde3-c67c-4316-b181-95c227479b58",
      customer: { number: `+1${providerDigits}` },
      assistant: {
        name: "Lily - Scheduling",
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }],
        },
        voice: { provider: "11labs", voiceId: "paula" },
        firstMessage: `Hi, my name is Lily. I'm a care coordinator with KinCare360, calling to schedule an appointment for one of my clients. Is this ${providerName || "the scheduling desk"}?`,
        endCallMessage: "Thank you so much for your help. Have a wonderful day!",
        serverUrl: "https://www.kincare360.com/api/call-logs",
      },
    };

    const vapiRes = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 3e6bdfb6-fc6f-4c60-a584-16cfa60e6846",
      },
      body: JSON.stringify(vapiBody),
    });

    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error("[schedule-appointment] VAPI error:", vapiData);
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I had trouble placing that call. Let me try again in a moment — or you can call them directly and I'll help you with the details." }]
      });
    }

    // Schedule callback to patient after 60 seconds
    if (callbackPhone) {
      const cbDigits = callbackPhone.replace(/\D/g, "").slice(-10);
      setTimeout(async () => {
        try {
          await fetch("https://api.vapi.ai/call/phone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer 3e6bdfb6-fc6f-4c60-a584-16cfa60e6846",
            },
            body: JSON.stringify({
              phoneNumberId: "8354bde3-c67c-4316-b181-95c227479b58",
              customer: { number: `+1${cbDigits}` },
              assistant: {
                name: "Lily - Callback",
                model: {
                  provider: "openai",
                  model: "gpt-4o-mini",
                  messages: [{ role: "system", content: `You are Lily from KinCare360, calling ${patientName} back to update them about an appointment you just scheduled with ${providerName || "their doctor"}. Be warm and natural. Let them know the status. If the office confirmed, share the date/time. If they didn't answer or you left a voicemail, let the patient know and suggest trying again during business hours.` }],
                },
                voice: { provider: "11labs", voiceId: "paula" },
                firstMessage: `Hi ${patient?.firstName || "there"}, this is Lily from KinCare360 calling you back about the appointment I just tried to schedule for you.`,
                serverUrl: "https://www.kincare360.com/api/call-logs",
              },
            }),
          });
        } catch (e) {
          console.error("[schedule-appointment] Callback failed:", e);
        }
      }, 60000);
    }

    console.log(`[schedule-appointment] Outbound call to ${providerName} at +1${providerDigits} for ${patientName}`);

    return NextResponse.json({
      results: [{ toolCallId: toolCall?.id || "", result: `I'm calling ${providerName || "the office"} right now to schedule your appointment. I'll call you back in a few minutes to confirm the details. You can hang up and I'll take care of everything.` }]
    });

  } catch (error) {
    console.error("[schedule-appointment] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I had a technical issue. Could you try requesting that again?" }]
    });
  }
}
