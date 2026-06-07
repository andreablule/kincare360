import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/session";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const KINCARE_PHONE_DISPLAY = "+1 272 766 9090";

async function createVapiCall(body: unknown) {
  if (!VAPI_API_KEY || !VAPI_PHONE_NUMBER_ID) {
    return { ok: false, data: { error: "Vapi is not configured" } };
  }

  const res = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VAPI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(user.role)) return Response.json({ error: "Read-only" }, { status: 403 });

  const body = await req.json();
  const {
    serviceRequestId,
    providerPhone,
    providerName,
    patientName,
    patientDob,
    preferredDate,
    preferredTime,
    reason,
    callbackPhone,
  } = body;

  if (!providerPhone || !serviceRequestId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!VAPI_API_KEY || !VAPI_PHONE_NUMBER_ID) {
    return Response.json({ error: "Vapi is not configured" }, { status: 500 });
  }

  const digitsOnly = providerPhone.replace(/\D/g, "");
  const customerNumber = "+1" + digitsOnly.slice(-10);

  const systemPrompt = `You are Lily, a non-medical care coordination assistant calling from KinCare360 to help schedule an appointment. You are calling ${providerName || "the provider"}. Patient name is ${patientName || "the patient"}, DOB is ${patientDob || "on file"}. Preferred date/time is ${preferredDate || "as soon as possible"} at ${preferredTime || "any available time"}. Reason for visit: ${reason || "general appointment"}. Steps: 1) Greet and identify yourself as Lily from KinCare360. 2) Give patient name and DOB. 3) Request the preferred date/time, if unavailable ask for the next available. 4) Confirm appointment details. 5) Thank them. Do not diagnose, give medical advice, or provide insurance information; say the patient will bring their insurance card to the appointment. If no one answers, leave a brief voicemail with callback number ${KINCARE_PHONE_DISPLAY}.`;

  const vapiBody = {
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: { number: customerNumber },
    assistant: {
      name: "Lily - KinCare360 Scheduling",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: {
        provider: "11labs",
        voiceId: "paula",
      },
      firstMessage:
        "Hi, this is Lily calling from KinCare360. May I speak with someone who can help me schedule an appointment?",
      endCallMessage: "Thank you so much. Have a great day!",
      serverUrl: "https://www.kincare360.com/api/call-logs",
    },
  };

  const vapiResult = await createVapiCall(vapiBody);

  if (!vapiResult.ok) {
    return Response.json({ error: "VAPI call failed", details: vapiResult.data }, { status: 500 });
  }

  await prisma.serviceRequest.update({
    where: { id: serviceRequestId },
    data: { status: "IN_PROGRESS" },
  });

  if (callbackPhone) {
    const cbDigits = callbackPhone.replace(/\D/g, "").slice(-10);
    const cbNumber = "+1" + cbDigits;

    setTimeout(async () => {
      try {
        await createVapiCall({
          phoneNumberId: VAPI_PHONE_NUMBER_ID,
          customer: { number: cbNumber },
          assistant: {
            name: "Lily - KinCare360 Update",
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `You are Lily, a non-medical care coordination assistant from KinCare360. You are calling ${patientName || "the patient"} to let them know that you just called ${providerName || "their provider"} to help schedule their appointment. Let them know you will confirm appointment details once confirmed. Be warm, brief, and reassuring. Do not give medical advice.`,
                },
              ],
            },
            voice: { provider: "11labs", voiceId: "paula" },
            firstMessage: `Hi, this is Lily from KinCare360 calling for ${patientName || "you"}. I just wanted to let you know I called ${providerName || "your provider"} to help schedule your appointment and I'll confirm the details shortly!`,
            endCallMessage: "Thank you so much. Have a great day!",
            serverUrl: "https://www.kincare360.com/api/call-logs",
          },
        });
      } catch {
        // Fire-and-forget, ignore errors
      }
    }, 45000);
  }

  return Response.json({ success: true, callId: (vapiResult.data as any).id });
}
