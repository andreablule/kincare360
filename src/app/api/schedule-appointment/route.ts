import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VAPI_KEY = "3e6bdfb6-fc6f-4c60-a584-16cfa60e6846";
const PHONE_NUMBER_ID = "8354bde3-c67c-4316-b181-95c227479b58";

async function makeVapiCall(body: any) {
  const res = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${VAPI_KEY}` },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

function buildOutboundAssistant(providerName: string, patientName: string, patientDob: string, insurance: string | null, preferredTime: string, reason: string) {
  const insuranceLine = insurance
    ? `If they ask about insurance, say: "${insurance}"`
    : `If they ask about insurance, say: "The patient will bring their insurance card to the appointment."`;

  return {
    name: "Lily - Scheduling",
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You are Lily, a care coordinator with KinCare360. You are calling ${providerName} to schedule an appointment.

CLIENT: ${patientName}, DOB: ${patientDob}
This is a new patient.
Preferred time: ${preferredTime}
Reason: ${reason}
${insuranceLine}

HOW TO ACT — like a real human care coordinator:
- Be natural, warm, professional
- If they answer: "Hi, my name is Lily. I'm a care coordinator calling to schedule a new patient appointment for ${patientName}."
- Give DOB when asked
- Ask for the earliest available time or client's preferred time
- If put on hold: wait patiently, do NOT hang up
- If they say "please hold" or "one moment": say "Of course, take your time" and wait
- If transferred to another person: re-introduce yourself
- Confirm: date, time, doctor name, any prep instructions
- If no one answers after ringing: leave a voicemail: "Hi, this is Lily from KinCare360 calling to schedule a new patient appointment for ${patientName}. Please call us back at 812-515-5252. Thank you!"
- If they ask who you are with: "KinCare360, a care coordination service"
- NEVER say you are AI
- Thank them and end warmly

CALLBACK: 812-515-5252`
      }],
    },
    voice: { provider: "11labs", voiceId: "paula" },
    firstMessage: `Hi, my name is Lily. I'm a care coordinator calling to schedule a new patient appointment. Is this ${providerName}?`,
    endCallMessage: "Thank you so much for your help!",
    serverUrl: "https://www.kincare360.com/api/call-logs",
    silenceTimeoutSeconds: 120,
    maxDurationSeconds: 300,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Parse VAPI tool call format
    let args: any = {};
    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }
    if (!args.providerPhone) args = body;

    const { providerName, providerPhone, preferredTime, reason } = args;

    if (!providerPhone) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I need the provider's phone number. Could you give me their number?" }]
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

    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "the patient";
    const patientDob = patient?.dob || "on file";
    const insurance = patient?.insuranceCompany
      ? `${patient.insuranceCompany}${patient.insuranceMemberId ? `, member ID ${patient.insuranceMemberId}` : ""}`
      : null;
    const callbackPhone = patient?.phone || callerPhone;

    const providerDigits = providerPhone.replace(/\D/g, "").slice(-10);
    if (providerDigits.length !== 10) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "That phone number doesn't look right. Could you give me the full 10-digit number?" }]
      });
    }

    // Store pending appointment in DB so we can handle callbacks
    // Using a simple approach: store in service request
    if (patient) {
      await prisma.serviceRequest.create({
        data: {
          patientId: patient.id,
          type: "APPOINTMENT",
          status: "IN_PROGRESS",
          description: `DATE: ${preferredTime || "earliest available"}\nDOCTOR: ${providerName || "New doctor"}\nDOCTOR PHONE: ${providerDigits}\nNOTES: ${reason || "General appointment"}\nSTATUS: Lily calling office`,
        },
      });
    }

    const assistant = buildOutboundAssistant(
      providerName || "the doctor's office",
      patientName, patientDob, insurance,
      preferredTime || "the earliest available",
      reason || "general consultation"
    );

    // Attempt 1
    const result1 = await makeVapiCall({
      phoneNumberId: PHONE_NUMBER_ID,
      customer: { number: `+1${providerDigits}` },
      assistant,
    });

    if (!result1.ok) {
      console.error("[schedule-appointment] VAPI error:", result1.data);
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I had trouble placing that call. I'll try again in a moment." }]
      });
    }

    console.log(`[schedule-appointment] Outbound call to ${providerName} at +1${providerDigits} for ${patientName}`);

    // Schedule retry after 3 minutes if first attempt doesn't connect
    // And callback to patient after 2 minutes
    setTimeout(async () => {
      try {
        // Check if the call ended without connecting (silence timeout, no answer)
        const callCheck = await fetch(`https://api.vapi.ai/call/${result1.data.id}`, {
          headers: { Authorization: `Bearer ${VAPI_KEY}` },
        });
        const callData = await callCheck.json();

        if (callData.endedReason === "silence-timed-out" || callData.endedReason === "customer-did-not-answer") {
          console.log("[schedule-appointment] First attempt failed, retrying...");
          // Retry
          await makeVapiCall({
            phoneNumberId: PHONE_NUMBER_ID,
            customer: { number: `+1${providerDigits}` },
            assistant,
          });
        }

        // Callback to patient
        if (callbackPhone) {
          const cbDigits = callbackPhone.replace(/\D/g, "").slice(-10);
          await makeVapiCall({
            phoneNumberId: PHONE_NUMBER_ID,
            customer: { number: `+1${cbDigits}` },
            assistant: {
              name: "Lily - Callback",
              model: {
                provider: "openai",
                model: "gpt-4o-mini",
                messages: [{
                  role: "system",
                  content: `You are Lily from KinCare360, calling ${patientName} back about the appointment with ${providerName || "their doctor"}.

If the office answered and you scheduled: tell them the appointment details.
If no one answered: say "I wasn't able to reach ${providerName || "the office"} — it might be outside their business hours. I left a voicemail with our callback number. I'll try again tomorrow during business hours, or you can call them directly at ${providerDigits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}."

Be warm and natural. Ask if there's anything else you can help with.`
                }],
              },
              voice: { provider: "11labs", voiceId: "paula" },
              firstMessage: `Hi ${patient?.firstName || "there"}, this is Lily from KinCare360 calling you back about the appointment.`,
              serverUrl: "https://www.kincare360.com/api/call-logs",
            },
          });
        }
      } catch (e) {
        console.error("[schedule-appointment] Retry/callback error:", e);
      }
    }, 120000); // 2 minutes

    return NextResponse.json({
      results: [{ toolCallId: toolCall?.id || "", result: `I'm calling ${providerName || "the office"} right now to schedule your appointment. I'll call you back in a few minutes to confirm the details. Have a wonderful evening!` }]
    });

  } catch (error) {
    console.error("[schedule-appointment] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I had a technical issue. Could you try that again?" }]
    });
  }
}
