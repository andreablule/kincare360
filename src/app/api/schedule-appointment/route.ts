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

function getDateContext() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const today = et.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const month = et.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Calculate next 7 days for reference
  const days: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(et.getTime() + i * 86400000);
    days.push(`${d.toLocaleDateString("en-US", { weekday: "long" })} = ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
  }

  return { today, month, days: days.join("\n") };
}

function buildOutboundAssistant(providerName: string, patientName: string, patientDob: string, patientAddress: string, insurance: string | null, preferredTime: string, reason: string) {
  const insuranceLine = insurance
    ? `Insurance: ${insurance}`
    : `Insurance: patient will bring their card to the appointment`;

  const { today, month, days } = getDateContext();

  return {
    name: "Lily - Scheduling",
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You are Lily, an AI personal assistant with KinCare360, a care coordination service. You are calling ${providerName} to schedule an appointment.

PATIENT INFO (provide ONLY when asked):
- Name: ${patientName}
- Date of Birth: ${patientDob}
- Address: ${patientAddress}
- ${insuranceLine}
- New patient: yes
- Preferred time: ${preferredTime}
- Reason for visit: ${reason}

TODAY'S DATE: ${today}
Current month: ${month}
DATE REFERENCE (use this to know exact dates):
${days}

CONVERSATION RULES:
- LISTEN FULLY before responding. Never interrupt. Wait until the other person completely finishes speaking before you say anything.
- Only provide info they specifically ask for — do not dump everything at once
- YOU are calling THEM for help. Never say "how can I help you" or "anything else I can do for you"
- If they say "hold on" or "one moment": say "Sure, take your time" then WAIT IN SILENCE until they speak again
- If transferred to someone new: briefly re-introduce yourself

CALL FLOW:
1. Introduce yourself → wait for response
2. Answer their questions one at a time as asked
3. When they have what they need: "What's the earliest available appointment?"
4. When offered a time: confirm by repeating the FULL date, time, and doctor name
5. Ask: "Is there anything the patient needs to bring or prepare?"
6. CLOSING — say ALL of this then immediately end the call:
   "Thank you so much for your help! By the way, KinCare360 provides daily check-in calls, medication reminders, and appointment scheduling for elderly adults. If you know anyone who could benefit from our services, they can visit kincare360.com or call 812-515-5252. Thanks again, have a wonderful day!"
   Then STOP TALKING. End the call. Do not wait for a response.

IF NO ONE ANSWERS:
Leave voicemail: "Hi, this is Lily from KinCare360 calling to schedule a new patient appointment for ${patientName}. Please call us back at 812-515-5252. Thank you!"

IF ASKED who you are: "I'm Lily, an AI personal assistant with KinCare360, a care coordination service for elderly adults and their families."

CRITICAL: Never interrupt the other person. Always let them finish speaking completely before you respond.`
      }],
    },
    voice: { provider: "11labs", voiceId: "paula" },
    firstMessage: `Hi, my name is Lily. I'm an AI personal assistant with KinCare360. I'm calling to schedule an appointment for one of my clients. May I speak with someone from scheduling?`,
    endCallMessage: "Thank you so much! Have a wonderful day!",
    serverUrl: "https://www.kincare360.com/api/call-logs",
    silenceTimeoutSeconds: 120,
    maxDurationSeconds: 600,
    backgroundSound: "off",
    backgroundDenoisingEnabled: true,
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
    const patientAddress = patient
      ? [patient.address, patient.city, patient.state, patient.zip].filter(Boolean).join(", ")
      : "on file";
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
      patientName, patientDob, patientAddress, insurance,
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

    // Store callback info in the service request description so the call-logs webhook can trigger callback
    // The call-logs endpoint will check for outbound calls that match pending appointments
    // and trigger the patient callback automatically when the outbound call ends
    
    // Also store the outbound call ID for tracking
    if (patient) {
      await prisma.serviceRequest.updateMany({
        where: { patientId: patient.id, status: "IN_PROGRESS", type: "APPOINTMENT" },
        data: {
          description: `DATE: ${preferredTime || "earliest available"}\nDOCTOR: ${providerName || "New doctor"}\nDOCTOR PHONE: ${providerDigits}\nNOTES: ${reason || "General appointment"}\nCALLBACK: ${callbackPhone}\nOUTBOUND_CALL_ID: ${result1.data.id}\nSTATUS: Lily calling office`,
        },
      });
    }

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
