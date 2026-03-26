import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/session";

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

  const digitsOnly = providerPhone.replace(/\D/g, "");
  const customerNumber = "+1" + digitsOnly;

  const systemPrompt = `You are Lily, a care coordination assistant calling from KinCare360 to schedule a medical appointment. You are calling ${providerName || "the provider"}. Patient name is ${patientName || "the patient"}, DOB is ${patientDob || "on file"}. Preferred date/time is ${preferredDate || "as soon as possible"} at ${preferredTime || "any available time"}. Reason for visit: ${reason || "general appointment"}. Steps: 1) Greet and identify yourself as Lily from KinCare360. 2) Give patient name and DOB. 3) Request the preferred date/time, if unavailable ask for the next available. 4) Confirm appointment details. 5) Thank them. Do NOT provide insurance information - say the patient will bring their insurance card to the appointment. If no one answers, leave a voicemail with callback number (812) 515-5252.`;

  const vapiBody = {
    phoneNumberId: "8354bde3-c67c-4316-b181-95c227479b58",
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
        "Hi, this is Lily calling from KinCare360. May I speak with someone who can help me schedule a patient appointment?",
      endCallMessage: "Thank you so much. Have a great day!",
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
    return Response.json({ error: "VAPI call failed", details: vapiData }, { status: 500 });
  }

  // Update service request to IN_PROGRESS
  await prisma.serviceRequest.update({
    where: { id: serviceRequestId },
    data: { status: "IN_PROGRESS" },
  });

  // Fire-and-forget: call the patient back after 45 seconds
  if (callbackPhone) {
    const cbDigits = callbackPhone.replace(/\D/g, "");
    const cbNumber = "+1" + cbDigits;

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
            customer: { number: cbNumber },
            assistant: {
              name: "Lily - KinCare360 Update",
              model: {
                provider: "openai",
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: `You are Lily, a care coordination assistant from KinCare360. You are calling ${patientName || "the patient"} to let them know that you just called ${providerName || "their provider"} to schedule their appointment. Let them know you will confirm the appointment details once confirmed. Be warm, brief, and reassuring.`,
                  },
                ],
              },
              voice: { provider: "11labs", voiceId: "paula" },
              firstMessage: `Hi, this is Lily from KinCare360 calling for ${patientName || "you"}. I just wanted to let you know I called ${providerName || "your provider"} to schedule your appointment and I'll confirm the details shortly!`,
              endCallMessage: "Thank you so much. Have a great day!",
              serverUrl: "https://www.kincare360.com/api/call-logs",
            },
          }),
        });
      } catch {
        // Fire-and-forget, ignore errors
      }
    }, 45000);
  }

  return Response.json({ success: true, callId: vapiData.id });
}
