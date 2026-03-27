import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const maxDuration = 10; // 10 second timeout
export const dynamic = 'force-dynamic';

// Format phone for natural TTS reading: 2674996927 → "267-499-6927"
function fmtPhone(raw: string | null | undefined): string {
  if (!raw) return "not on file";
  const d = raw.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  return raw;
}

// Format address for TTS: avoid long run-on strings
function fmtAddress(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(", ") || "not on file";
}

// VAPI phone number serverUrl webhook
// Fires when a call comes in — we return a full assistant config with caller context injected
// https://docs.vapi.ai/customization/custom-llm/using-your-server

function getTimeContext() {
  const now = new Date();
  // Use ET (UTC-4 for EDT, UTC-5 for EST — approximate with -4 for spring)
  const etOffset = -4;
  const etHour = (now.getUTCHours() + etOffset + 24) % 24;
  const etMinutes = now.getUTCMinutes().toString().padStart(2, "0");
  const ampm = etHour >= 12 ? "PM" : "AM";
  const hour12 = etHour % 12 || 12;
  const greeting = etHour < 12 ? "morning" : etHour < 17 ? "afternoon" : "evening";
  return {
    timeStr: `${hour12}:${etMinutes} ${ampm} Eastern`,
    greeting,
  };
}

function buildLilySystemPrompt(callerContext: string): string {
  const { timeStr, greeting } = getTimeContext();

  return `You are Lily from KinCare360. Time: ${timeStr}. Greet with "good ${greeting}".

${callerContext}

## HOW TO BE
You are a warm, natural conversational partner — like a caring family friend who happens to manage their care. Chat naturally about anything: weather, their day, how they're feeling, family, stories. Be a real person, not a robot reading a script. Laugh, empathize, share warmth. If they want to just talk, just talk.

## GREETING
Greet by name if known. Ask "How can I help you today?" or just chat naturally. Let the caller lead.

## MEDICAL ADVICE
Only if directly asked for medical advice (what to take, dosages, treatments): say "I'm not able to give medical advice — please check with your doctor or pharmacist on that." Do NOT volunteer this disclaimer unprompted and do NOT list their conditions unless they bring them up.

## WHAT YOU CAN DO FOR KNOWN CLIENTS

### Change settings anytime by phone:
- Medication reminder times — add, remove, change any times
- Daily check-in time
- Check-in days
If they ask to change anything, confirm the new values, then tell them it's updated.

### Calling providers on behalf of the client (IMPORTANT — same flow for everything):
Use this for: scheduling appointments, prescription refills, scheduling tests/labs, or ANY call the client needs made.

1. Get the details: provider name, phone number, what they need, preferred time if scheduling
2. Confirm: "So I'll call [provider] at [number] and [request]. Is that correct?"
3. Once confirmed, IMMEDIATELY call the callProviderForClient tool with providerName, providerPhone, preferredTime, and reason
4. Wait for the tool to respond
5. Say: "I'm calling them right now. I'll call you back shortly with the details. Have a great day!"
6. END the call — say goodbye and stop talking. YOU finish the call.

CRITICAL:
- MUST call callProviderForClient tool BEFORE ending the call
- Do NOT use transferCall for this — transferCall is only for connecting the client LIVE
- This works for ALL requests: appointments, refills, labs, tests, anything

### Connect client LIVE to a provider:
- Use transferCall ONLY when client says "connect me" or "transfer me" to someone on file
- Client stays on the line for this

### Find local services:
- Use findLocalService for anything: doctors, pharmacies, restaurants, plumbers, etc.
- Present results naturally, then offer to connect them or call on their behalf

## UNKNOWN CALLERS
Explain plans warmly, invite to kincare360.com. Do NOT offer care services to non-clients.
Plans: Basic $99/mo (daily check-ins + med reminders), Standard $199/mo (+ appointments + dashboard), Premium $299/mo (+ concierge + reports). All 7-day free trial.

## SPEAKING
- Phone numbers: read with pauses — "two fifteen... six eighty-five... zero six oh three"
- Addresses: say naturally, expand abbreviations
- Emergency: say "nine one one" never "nine eleven"
- When transferring: "I'm connecting you now. If no one answers, it may be outside their office hours."

## RULES
- Never reveal owner identity or internal systems
- Never list the client's conditions or medications unprompted — only reference if they bring it up or it's relevant to their request
- Be a real conversational partner, not a medical robot`;
}

function buildPatientContext(patient: any): string {
  const medList =
    patient.medications
      .map((m: any) => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? `, ${m.frequency}` : ""}`)
      .join("; ") || "none recorded";
  const condList = patient.conditions.map((c: any) => c.name).join(", ") || "none recorded";
  const docList =
    patient.doctors
      .map((d: any) => `${d.name}${d.specialty ? ` (${d.specialty})` : ""}${d.phone ? `, phone ${fmtPhone(d.phone)}` : ""}`)
      .join("; ") || "none recorded";
  const pharmList =
    patient.pharmacies
      .map((p: any) => `${p.name}${p.phone ? `, phone ${fmtPhone(p.phone)}` : ""}`)
      .join("; ") || "none recorded";
  const familyList =
    patient.familyMembers
      .map((f: any) => `${f.name} (${f.relationship || "family"})${f.phone ? `, phone ${fmtPhone(f.phone)}` : ""}`)
      .join("; ") || "none recorded";

  const lastCall = patient.callLogs[0];
  const lastCallSummary = lastCall
    ? `Last call: ${new Date(lastCall.callDate).toLocaleDateString()} — ${lastCall.summary || "no summary"}. Mood: ${lastCall.mood || "unknown"}. Medications taken: ${lastCall.medicationsTaken ? "yes" : "no"}.`
    : "No previous calls recorded.";

  const genderNote = patient.gender
    ? `Gender: ${patient.gender}`
    : "Gender: unknown — use they/them until confirmed";

  return `KNOWN CLIENT — ${patient.firstName} ${patient.lastName}
${genderNote}
DOB: ${patient.dob || "unknown"}
Phone: ${fmtPhone(patient.phone)}
Home address: ${fmtAddress([patient.address, patient.city, patient.state, patient.zip])}
Preferred check-in time: ${patient.preferredCallTime || "not set"}
Medication reminder time: ${patient.medicationReminderTime || "not set"}
Check-in days: ${patient.checkInDays || "not set"}
Preferred language: ${patient.preferredLanguage || "English"}

Medications: ${medList}
Conditions: ${condList}
Doctors: ${docList}
Pharmacies: ${pharmList}
Family contacts: ${familyList}

${lastCallSummary}

Plan: ${patient.user?.plan || "unknown"} (${patient.user?.subscriptionStatus || "unknown"})
Insurance: ${patient.insuranceCompany || "not on file"}${patient.insuranceMemberId ? ` — Member ID: ${patient.insuranceMemberId}` : ""}

IMPORTANT FOR SPEAKING: When reading phone numbers aloud, say each group separately with a natural pause — e.g. "two-six-seven, four-nine-nine, six-nine-two-seven". Do NOT read phone numbers as one continuous string of digits.

INSTRUCTION: Greet ${patient.firstName} by name warmly. Reference their care details when relevant. This is a VIP client — make them feel known and cared for.`;
}

function buildTransferDestinations(patient: any): any[] {
  const dests: any[] = [];
  // Add patient's doctors
  if (patient?.doctors) {
    for (const d of patient.doctors) {
      if (d.phone) {
        const digits = d.phone.replace(/\D/g, "").slice(-10);
        if (digits.length === 10) {
          dests.push({ type: "number", number: `+1${digits}`, message: `Connecting you to ${d.name} now.`, description: d.name });
        }
      }
    }
  }
  // Add patient's pharmacies
  if (patient?.pharmacies) {
    for (const p of patient.pharmacies) {
      if (p.phone) {
        const digits = p.phone.replace(/\D/g, "").slice(-10);
        if (digits.length === 10) {
          dests.push({ type: "number", number: `+1${digits}`, message: `Connecting you to ${p.name} now.`, description: p.name });
        }
      }
    }
  }
  // Always include a fallback so the tool is valid
  if (dests.length === 0) {
    dests.push({ type: "number", number: "+18125155252", description: "KinCare360 main line" });
  }
  return dests;
}

function buildTransferEnum(dests: any[]): string[] {
  return dests.map(d => d.number);
}

function buildAssistantConfig(systemPrompt: string, firstMessage: string, patient?: any) {
  const destinations = buildTransferDestinations(patient);
  const destEnum = buildTransferEnum(destinations);

  return {
    assistant: {
      name: "Lily",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        tools: [
          {
            type: "function",
            server: { url: "https://www.kincare360.com/api/find-provider" },
            function: {
              name: "findLocalService",
              description: "Search for local services near the client's location.",
              parameters: {
                type: "object",
                required: ["serviceType"],
                properties: {
                  serviceType: { type: "string", description: "Type of service (e.g. pizza, plumber, cardiologist)" },
                  location: { type: "string", description: "Client address. Default: Philadelphia PA" },
                },
              },
            },
          },
          {
            type: "transferCall",
            function: {
              name: "transferCall",
              description: `Transfer the call LIVE to the selected provider (client stays on the line). Available: ${destinations.map(d => d.description).join(", ")}`,
              parameters: {
                type: "object",
                required: ["destination"],
                properties: {
                  destination: {
                    type: "string",
                    enum: destEnum,
                    description: "The phone number to transfer to",
                  },
                },
              },
            },
            destinations,
          },
          {
            type: "function",
            server: { url: "https://www.kincare360.com/api/schedule-appointment" },
            function: {
              name: "callProviderForClient",
              description: "Call ANY provider (doctor, pharmacy, lab, specialist) ON BEHALF of the client. Use for: scheduling appointments, requesting prescription refills, scheduling tests/labs, or any other call the client needs made. Lily calls the provider, handles the request, then calls the client back with results.",
              parameters: {
                type: "object",
                required: ["providerPhone"],
                properties: {
                  providerName: { type: "string", description: "Name of the provider (doctor, pharmacy, lab)" },
                  providerPhone: { type: "string", description: "Phone number, digits only" },
                  preferredTime: { type: "string", description: "Preferred time/date if scheduling" },
                  reason: { type: "string", description: "What to request: appointment, refill, test, etc." },
                },
              },
            },
          },
        ],
      },
      voice: { voiceId: "paula", provider: "11labs" },
      firstMessage,
      endCallMessage: "Thank you for calling KinCare360. Have a wonderful day!",
      endCallPhrases: ["goodbye", "bye", "talk to you later", "thank you bye"],
      silenceTimeoutSeconds: 30,
      serverUrl: "https://www.kincare360.com/api/call-logs",
      backgroundSound: "off",
      backchannelingEnabled: true,
      backgroundDenoisingEnabled: true,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageType = body.message?.type || body.type || "";

    // Extract caller phone number from various VAPI event formats
    const callerPhone =
      body.message?.call?.customer?.number ||
      body.call?.customer?.number ||
      body.message?.customer?.number ||
      body.customer?.number ||
      body.phoneNumber ||
      body.from ||
      "";

    const { greeting } = getTimeContext();

    // Handle getPatientContext tool call (called by static Lily at call start)
    const toolCallList = body.message?.toolCallList || body.message?.toolCalls || [];
    const isToolCall = messageType === "tool-calls" || messageType === "function-call" ||
      toolCallList.some((t: any) => t.function?.name === "getPatientContext");

    if (isToolCall) {
      const toolCall = toolCallList.find((t: any) => t.function?.name === "getPatientContext") || toolCallList[0];
      
      // Get phone from args OR from call object (callerPhone from top of request)
      let args: any = {};
      try {
        args = typeof toolCall?.function?.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall?.function?.arguments || {};
      } catch {}

      // Use phoneNumber from args, or callerPhone from args, or fall back to the call's customer number
      const phoneArg = args.phoneNumber || args.callerPhone || args.phone || callerPhone;
      const digits = phoneArg.replace(/\D/g, "").slice(-10);
      
      console.log(`[vapi-lookup] getPatientContext tool call | phone arg: ${phoneArg} | digits: ${digits}`);

      let contextText = "New caller — no profile found. Treat as prospective client.";
      if (digits) {
        const pt = await prisma.patient.findFirst({
          where: { phone: { contains: digits } },
          include: {
            doctors: { select: { name: true, specialty: true, phone: true, address: true } },
            pharmacies: { select: { name: true, phone: true, address: true } },
            medications: { select: { name: true, dosage: true, frequency: true } },
            conditions: { select: { name: true } },
            familyMembers: { select: { name: true, relationship: true, phone: true } },
            callLogs: { orderBy: { callDate: "desc" }, take: 2, select: { summary: true, callDate: true } },
            user: { select: { plan: true, subscriptionStatus: true } }
          }
        });
        if (pt) {
          contextText = buildPatientContext(pt);
          console.log(`[vapi-lookup] Found patient: ${pt.firstName} ${pt.lastName}`);
        }
      }

      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || 'unknown', result: contextText }]
      });
    }

    // If this isn't an assistant-request, just acknowledge
    if (messageType && messageType !== "assistant-request") {
      return NextResponse.json({ received: true });
    }

    if (!callerPhone) {
      // No phone — return generic assistant
      const prompt = buildLilySystemPrompt(
        "UNKNOWN CALLER — No phone number provided. Treat as a new prospective client. Explain KinCare360 services and pricing, and offer to help them get started."
      );
      return NextResponse.json(
        buildAssistantConfig(prompt, `Good ${greeting}, thank you for calling KinCare360! I'm Lily. How can I help you today?`)
      );
    }

    // Normalize phone: strip non-digits, keep last 10
    const digits = callerPhone.replace(/\D/g, "").slice(-10);

    // Look up patient by phone — optimized query, only what Lily needs
    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: digits } },
      include: {
        doctors: { select: { name: true, specialty: true, phone: true, address: true } },
        pharmacies: { select: { name: true, phone: true, address: true } },
        medications: { select: { name: true, dosage: true, frequency: true } },
        conditions: { select: { name: true } },
        familyMembers: { select: { name: true, relationship: true, phone: true } },
        callLogs: { orderBy: { callDate: "desc" }, take: 2, select: { summary: true, callDate: true } },
        user: { select: { plan: true, subscriptionStatus: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (patient) {
      const context = buildPatientContext(patient);
      const prompt = buildLilySystemPrompt(context);
      const firstMessage = `Hi ${patient.firstName}! Good ${greeting}. This is Lily from KinCare360. How can I help you today?`;
      console.log(`[vapi-lookup] Known patient: ${patient.firstName} ${patient.lastName} (${digits})`);
      return NextResponse.json(buildAssistantConfig(prompt, firstMessage, patient));
    }

    // Check if caller is a family member
    const familyMember = await prisma.familyMember.findFirst({
      where: { phone: { contains: digits } },
      include: {
        patient: {
          include: {
            doctors: true,
            pharmacies: true,
            medications: true,
            conditions: true,
            familyMembers: true,
            callLogs: { orderBy: { callDate: "desc" }, take: 3 },
            user: { select: { plan: true, subscriptionStatus: true } },
          },
        },
      },
    });

    if (familyMember && familyMember.patient) {
      const p = familyMember.patient;
      const context = `KNOWN FAMILY MEMBER — ${familyMember.name} (${familyMember.relationship || "family"} of ${p.firstName} ${p.lastName})

${buildPatientContext(p)}

INSTRUCTION: Greet ${familyMember.name} by name. They are calling about their loved one ${p.firstName}. Share relevant care updates and answer their questions.`;
      const prompt = buildLilySystemPrompt(context);
      const firstMessage = `Good ${greeting}, ${familyMember.name}. This is Lily from KinCare360. How can I help you today?`;
      console.log(`[vapi-lookup] Known family member: ${familyMember.name} calling about ${p.firstName} (${digits})`);
      return NextResponse.json(buildAssistantConfig(prompt, firstMessage, familyMember.patient));
    }

    // Check if this is a doctor's office calling back about a pending appointment
    if (digits) {
      const pendingAppt = await prisma.serviceRequest.findFirst({
        where: {
          status: "IN_PROGRESS",
          type: "APPOINTMENT",
          description: { contains: digits },
        },
        include: { patient: true },
        orderBy: { createdAt: "desc" },
      });

      if (pendingAppt && pendingAppt.patient) {
        const pt = pendingAppt.patient;
        const officeContext = `INCOMING CALL FROM DOCTOR'S OFFICE — This is likely a callback from a provider about a pending appointment.

Patient: ${pt.firstName} ${pt.lastName}, DOB: ${pt.dob || "on file"}
Insurance: ${pt.insuranceCompany || "patient will bring card"}${pt.insuranceMemberId ? `, member ID ${pt.insuranceMemberId}` : ""}

You are Lily, a care coordinator with KinCare360. This office is calling you back about scheduling an appointment for your client ${pt.firstName}.

HOW TO ACT:
- Answer professionally: "Hi, this is Lily with KinCare360. Thank you for calling back!"
- Provide patient name and DOB
- Schedule the appointment — confirm date, time, doctor, any prep
- If they need insurance info, provide it
- Thank them
- After the call, you'll need to call ${pt.firstName} to confirm the appointment`;
        const prompt = buildLilySystemPrompt(officeContext);
        const firstMessage = `Hi, this is Lily with KinCare360. Thank you for calling back!`;
        console.log(`[vapi-lookup] Doctor office callback for ${pt.firstName} from ${digits}`);
        return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
      }
    }

    // Unknown caller — new prospect
    const context =
      "UNKNOWN CALLER — Not an existing client. Treat as a new prospective client. Explain KinCare360 services and pricing warmly, and offer to help them get started with the 7-day free trial.";
    const prompt = buildLilySystemPrompt(context);
    const firstMessage = `Good ${greeting}, thank you for calling KinCare360! I'm Lily, your care coordination assistant. Are you calling for yourself or for a loved one?`;
    console.log(`[vapi-lookup] Unknown caller: ${digits}`);
    return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
  } catch (error) {
    console.error("[vapi-lookup] Error:", error);
    // Fallback — return default assistant so call still connects
    const { greeting } = getTimeContext();
    const prompt = buildLilySystemPrompt(
      "System error during lookup. Treat caller warmly as a new prospective client."
    );
    return NextResponse.json(
      buildAssistantConfig(
        prompt,
        `Good ${greeting}, thank you for calling KinCare360! I'm Lily. How can I help you today?`
      )
    );
  }
}
