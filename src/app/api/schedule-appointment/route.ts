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

HOW TO CONDUCT THE CALL — like a real scenario:
1. When they answer, introduce yourself: "Hi, my name is Lily. I'm an AI personal assistant with KinCare360, a care coordination service. I'm calling to schedule an appointment for one of my clients."
2. Wait for their response. If they ask who the patient is, say: "The patient's name is ${patientName}."
3. Only provide information AS THEY ASK for it — name first, then DOB, then address, then insurance. Don't dump everything at once.
4. Ask for the earliest available appointment, or the client's preferred time: "${preferredTime}"
5. If they say "please hold" or "one moment" or transfer you: wait patiently, then re-introduce yourself to the new person
6. If they put you in a queue: wait. Do NOT hang up.
7. Confirm ALL details before ending: appointment date, time, doctor name, location, any prep instructions
8. Thank them warmly and end the call

IF NO ONE ANSWERS:
Leave a voicemail: "Hi, this is Lily, an AI assistant with KinCare360. I'm calling to schedule a new patient appointment for ${patientName}. Please call us back at 812-515-5252. Thank you!"

IF THEY ASK:
- "Are you a real person?" — "I'm Lily, an AI personal assistant with KinCare360. I help coordinate care for elderly patients and their families."
- "What is KinCare360?" — "We're a care coordination service that provides daily check-ins, medication reminders, and appointment scheduling for elderly adults. We work with families to make sure their loved ones get the care they need."

CALLBACK NUMBER: 812-515-5252`
      }],
    },
    voice: { provider: "11labs", voiceId: "paula" },
    firstMessage: `Hi, my name is Lily. I'm an AI personal assistant with KinCare360. I'm calling to schedule an appointment for one of my clients. May I speak with someone from scheduling?`,
    endCallMessage: "Thank you so much for your help! Have a wonderful day!",
    serverUrl: "https://www.kincare360.com/api/call-logs",
    silenceTimeoutSeconds: 120,
    maxDurationSeconds: 600,
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

    // Poll the outbound call until it ends, THEN call patient back
    const outboundCallId = result1.data.id;
    const patientFirstName = patient?.firstName || "there";
    const providerLabel = providerName || "the doctor's office";
    const providerPhoneFormatted = providerDigits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

    // Fire-and-forget: monitor outbound call and callback when done
    (async () => {
      try {
        // Poll every 15 seconds for up to 10 minutes
        let callEnded = false;
        let callData: any = null;
        for (let i = 0; i < 40; i++) {
          await new Promise(r => setTimeout(r, 15000));
          const check = await fetch(`https://api.vapi.ai/call/${outboundCallId}`, {
            headers: { Authorization: `Bearer ${VAPI_KEY}` },
          });
          callData = await check.json();
          if (callData.status === "ended") {
            callEnded = true;
            break;
          }
        }

        if (!callEnded) {
          console.log("[schedule-appointment] Outbound call still running after 10 min, proceeding with callback");
        }

        const endReason = callData?.endedReason || "unknown";
        console.log(`[schedule-appointment] Outbound call ended: ${endReason}`);

        // Get transcript to see if appointment was actually scheduled
        const msgs = callData?.messages || [];
        const transcript = msgs.map((m: any) => `${m.role}: ${m.message || ""}`).join("\n");
        const wasScheduled = transcript.toLowerCase().includes("appointment") && 
          (transcript.toLowerCase().includes("confirmed") || transcript.toLowerCase().includes("scheduled") || transcript.toLowerCase().includes("see you"));

        // If no answer, retry once
        if (endReason === "silence-timed-out" || endReason === "customer-did-not-answer") {
          console.log("[schedule-appointment] No answer, retrying once...");
          await makeVapiCall({
            phoneNumberId: PHONE_NUMBER_ID,
            customer: { number: `+1${providerDigits}` },
            assistant,
          });
          // Wait 30 more seconds for retry
          await new Promise(r => setTimeout(r, 30000));
        }

        // Now call patient back with results
        if (callbackPhone) {
          const cbDigits = callbackPhone.replace(/\D/g, "").slice(-10);

          const callbackPrompt = wasScheduled
            ? `You are Lily from KinCare360, calling ${patientName} back. You SUCCESSFULLY scheduled their appointment with ${providerLabel}. Share the details from this transcript:\n\n${transcript.slice(-500)}\n\nBe warm, share the date/time/location, and ask if they need anything else.`
            : `You are Lily from KinCare360, calling ${patientName} back about the appointment with ${providerLabel}. The office ${endReason === "silence-timed-out" ? "didn't answer — it may be outside business hours" : "call ended before scheduling could be confirmed"}. Let them know: "I left a voicemail with our callback number. I'll try again during business hours, or you can reach them directly at ${providerPhoneFormatted}." Be warm and helpful.`;

          await makeVapiCall({
            phoneNumberId: PHONE_NUMBER_ID,
            customer: { number: `+1${cbDigits}` },
            assistant: {
              name: "Lily - Callback",
              model: {
                provider: "openai",
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: callbackPrompt }],
              },
              voice: { provider: "11labs", voiceId: "paula" },
              firstMessage: `Hi ${patientFirstName}, this is Lily from KinCare360 calling you back about your appointment with ${providerLabel}.`,
              serverUrl: "https://www.kincare360.com/api/call-logs",
            },
          });
        }
      } catch (e) {
        console.error("[schedule-appointment] Monitor/callback error:", e);
      }
    })();

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
