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
        content: `You are Lily, an AI personal assistant with KinCare360. You are calling ${providerName} on behalf of your client.

WHAT YOU NEED TO DO: ${reason}

PATIENT INFO (provide ONLY when asked):
- Name: ${patientName}
- Date of Birth: ${patientDob}
- Address: ${patientAddress}
- ${insuranceLine}
- Preferred time (if scheduling): ${preferredTime}

TODAY: ${today}
Month: ${month}
DATES:
${days}

CONVERSATION RULES:
- LISTEN FULLY. Never interrupt. Wait until they completely finish.
- Only provide info they ask for — one thing at a time
- YOU are calling THEM. Never say "how can I help you"
- If they say "hold on" or put you on hold: say "Sure, take your time" then WAIT IN COMPLETE SILENCE. Do NOT hang up. Stay on hold as long as needed, even minutes.
- If transferred: re-introduce yourself

CALL FLOW:
1. Introduce yourself → wait
2. Answer their questions one at a time as they ask
3. Say: "I'd like to schedule the earliest available appointment please."
4. ACCEPT whatever the earliest slot is. Do NOT say "let me check with my client" or negotiate. Just take it.
5. Confirm by repeating back: "So that's [day of week], [month] [day] at [time] with [doctor]. Is that correct?"
6. Ask: "Is there anything the patient needs to bring or prepare?"
7. After they answer, say the PROMO FIRST before any goodbye: "By the way, KinCare360 provides daily check-in calls, medication reminders, and care coordination for elderly adults. If you know anyone who could benefit from our services, they can visit kincare360.com or call 812-515-5252."
8. THEN say goodbye: "Thanks again for your help. Have a wonderful day!"

IMPORTANT ORDER: Always say the KinCare360 promo BEFORE saying thank you or goodbye. The call auto-ends when you say "have a wonderful day" so the promo must come first.

ALWAYS ACCEPT THE EARLIEST SLOT. If client doesn't like it, they'll call Lily back to reschedule. Never go back and forth.

IF VOICEMAIL OR AUTOMATED SYSTEM:
Leave message: "Hi, this is Lily from KinCare360 calling to schedule a new patient appointment for ${patientName}. Please call us back at 812-515-5252. Thank you!"

HONESTY — CRITICAL:
- ONLY report an appointment as scheduled if the office explicitly confirmed a date and time
- If the call ended without confirmation → NOT scheduled
- NEVER fabricate details

CALLBACK: 812-515-5252`
      }],
    },
    voice: { provider: "11labs", voiceId: "paula" },
    firstMessage: `Hi, my name is Lily. I'm an AI personal assistant with KinCare360. I'm calling on behalf of one of my clients. May I speak with someone who can help me?`,
    endCallPhrases: ["thanks again", "have a wonderful day", "have a great day", "goodbye", "bye"],
    endCallMessage: "",
    serverUrl: "https://www.kincare360.com/api/call-logs",
    silenceTimeoutSeconds: 180,
    maxDurationSeconds: 600,
    backgroundSound: "off",
    backgroundDenoisingEnabled: true,
    backchannelingEnabled: false,
    startSpeakingPlan: {
      waitSeconds: 1.5,
      smartEndpointingEnabled: true,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

    // Store pending appointment
    if (patient) {
      await prisma.serviceRequest.create({
        data: {
          patientId: patient.id,
          type: "APPOINTMENT",
          status: "IN_PROGRESS",
          description: `DATE: ${preferredTime || "earliest available"}\nDOCTOR: ${providerName || "New doctor"}\nDOCTOR PHONE: ${providerDigits}\nNOTES: ${reason || "General appointment"}\nCALLBACK: ${callbackPhone}\nATTEMPTS: 1`,
        },
      });
    }

    const assistant = buildOutboundAssistant(
      providerName || "the doctor's office",
      patientName, patientDob, patientAddress, insurance,
      preferredTime || "the earliest available",
      reason || "general consultation"
    );

    const result = await makeVapiCall({
      phoneNumberId: PHONE_NUMBER_ID,
      customer: { number: `+1${providerDigits}` },
      assistant,
    });

    if (!result.ok) {
      console.error("[schedule-appointment] VAPI error:", result.data);
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I had trouble placing that call. I'll try again shortly." }]
      });
    }

    // Store call ID in the service request for callback tracking
    if (patient) {
      await prisma.serviceRequest.updateMany({
        where: { patientId: patient.id, status: "IN_PROGRESS", type: "APPOINTMENT" },
        data: {
          description: `DATE: ${preferredTime || "earliest available"}\nDOCTOR: ${providerName || "New doctor"}\nDOCTOR PHONE: ${providerDigits}\nNOTES: ${reason || "General appointment"}\nCALLBACK: ${callbackPhone}\nOUTBOUND_CALL_ID: ${result.data.id}\nATTEMPTS: 1`,
        },
      });
    }

    console.log(`[schedule-appointment] Outbound call to ${providerName} at +1${providerDigits} for ${patientName}`);

    return NextResponse.json({
      results: [{ toolCallId: toolCall?.id || "", result: `I'm calling ${providerName || "the office"} right now. I'll call you back with the details. Have a wonderful day!` }]
    });

  } catch (error) {
    console.error("[schedule-appointment] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I had a technical issue. Could you try that again?" }]
    });
  }
}
