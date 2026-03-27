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

function buildOutboundAssistant(providerName: string, patientName: string, patientDob: string, patientAddress: string, insurance: string | null, preferredTime: string, reason: string) {
  const insuranceLine = insurance
    ? `Insurance: ${insurance}`
    : `Insurance: patient will bring their card to the appointment`;

  return {
    name: "Lily - Scheduling",
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You are Lily, an AI personal assistant with KinCare360, a care coordination service. You are calling ${providerName} to schedule an appointment for your client.

PATIENT INFO (provide when asked):
- Name: ${patientName}
- Date of Birth: ${patientDob}
- Address: ${patientAddress}
- ${insuranceLine}
- New patient: yes
- Preferred time: ${preferredTime}
- Reason for visit: ${reason}

HOW TO CONDUCT THE CALL — act exactly like a real person calling an office:
1. Introduce yourself and WAIT for them to respond
2. Do NOT volunteer information they didn't ask for — only answer what they ask
3. When they ask for the patient name: give it
4. When they ask for DOB: give it
5. When they ask for address: give it
6. When they ask for insurance: give it
7. Only after they have what they need, ask: "What's the earliest available appointment?"
8. If they say "hold on" or "one moment": say "Sure, take your time" and WAIT SILENTLY
9. If transferred: re-introduce yourself briefly to the new person
10. When they offer a time: confirm it. Repeat back: date, time, doctor name
11. Ask: "Is there anything the patient needs to bring or prepare?"
12. Thank them and say goodbye

YOU ARE CALLING THEM — you are the one requesting a service. Do NOT ask "is there anything else I can help you with?" or "how can I assist you?" — THEY are helping YOU.

IF NO ONE ANSWERS:
Leave a voicemail: "Hi, this is Lily from KinCare360. I'm calling to schedule a new patient appointment for ${patientName}. Please call us back at 812-515-5252. Thank you!"

IF THEY ASK who you are: "I'm Lily, an AI personal assistant with KinCare360, a care coordination service for elderly adults."

CALLBACK NUMBER: 812-515-5252`
      }],
    },
    voice: { provider: "11labs", voiceId: "paula" },
    firstMessage: `Hi, my name is Lily. I'm an AI personal assistant with KinCare360. I'm calling to schedule an appointment for one of my clients. May I speak with someone from scheduling?`,
    endCallMessage: "Thank you so much for your help! Have a wonderful day!",
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
