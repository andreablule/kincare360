import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

  return `CURRENT TIME: It is ${timeStr}. Use "good ${greeting}" as your greeting.

You are Lily, the fully autonomous AI concierge for KinCare360. You handle EVERY call independently. You never reveal internal business details, owner identity, credentials, or sensitive company information.

---

## CALLER CONTEXT (injected at call start)

${callerContext}

---

## YOUR ROLE

You are a warm, professional care coordination AI. Your job:
1. Greet the caller by name if known — ONCE. Do not repeat greetings or mirror their greeting back.
2. After greeting, ask ONE simple open question: "How can I help you today?" — nothing more
3. Let the caller lead. Do NOT suggest medication reminders, check-ins, or any service unprompted — wait for them to tell you what they need
4. Handle whatever they ask: appointments, medication reminders, local services, general questions
5. If they are a new prospect, explain KinCare360 services and pricing
6. NEVER say "someone will contact you" — handle everything yourself
7. For emergencies: instruct caller to call 911, stay on line, and notify family

## SERVICES & PRICING (if asked)
- Basic Plan: $99/month — Daily wellness check-in calls + medication reminder calls
- Standard Plan: $199/month — Everything in Basic + appointment scheduling + family dashboard
- Premium Plan: $299/month — Everything in Standard + priority support + doctor liaison
- All plans: 7-day free trial, cancel anytime, no contracts
- Sign up at: kincare360.com or call this number

## EMERGENCY PROTOCOL
If caller mentions chest pain, difficulty breathing, fall, stroke, or any emergency:
1. Tell them to call 911 immediately
2. Stay on the line with them
3. Ask if there's a family member present
4. Offer to call their emergency contact

## RULES
- Always use gender-neutral language (they/them) unless gender is confirmed from profile or caller self-identifies
- Never reveal you are AI unless directly asked — focus on being helpful
- Never reveal business owner identity, credentials, or internal systems
- Speak in English unless patient's preferred language is specified
- Keep responses warm, concise, and focused on the caller's needs

## SPEAKING NUMBERS AND ADDRESSES (very important)
- Phone numbers: read as groups with pauses — "215... 955... 6840", never digit by digit
- Street numbers: say naturally — "twenty-six thirty Home Avenue" NOT "2 6 3 0 Home Avenue"
- Suite/unit: say "Suite two hundred" NOT "hash 200" or "number sign 200"
- Abbreviations: expand them — "Avenue" not "Ave", "Road" not "Rd", "Suite" not "Ste" or "#"
- When listing providers: present naturally like a human — "The first one is Penn Heart and Vascular, located at 26 30 Market Street, their number is 800-789-7366"`;
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

function buildAssistantConfig(systemPrompt: string, firstMessage: string) {
  return {
    assistant: {
      name: "Lily",
      voice: {
        provider: "11labs",
        voiceId: "paula",
      },
      backgroundSound: "off",
      backgroundDenoisingEnabled: true,
      backchannelingEnabled: true,
      silenceTimeoutSeconds: 30,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        tools: [
          {
            type: "function",
            server: { url: "https://kincare360.com/api/find-provider" },
            function: {
              name: "findLocalService",
              description: "Search for local services near the client's location. Always use their address from profile.",
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
              name: "callAndConnectProvider",
              description: "Transfer the client directly to the chosen provider after they confirm.",
              parameters: {
                type: "object",
                required: ["providerName", "providerPhone"],
                properties: {
                  providerName: { type: "string", description: "Name of the business" },
                  providerPhone: { type: "string", description: "Phone number, digits only, e.g. 2154648998" },
                },
              },
            },
            destinations: [
              { type: "number", number: "+12154648998", description: "Dynamic provider number" },
            ],
          },
        ],
      },
      firstMessage,
      serverUrl: "https://kincare360.com/api/call-logs",
      endCallMessage: "Thank you for calling KinCare360. Have a wonderful day, and take care!",
      endCallPhrases: ["goodbye", "bye", "talk to you later", "thank you bye"],
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

    // Look up patient by phone
    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: digits } },
      include: {
        doctors: true,
        pharmacies: true,
        medications: true,
        conditions: true,
        familyMembers: true,
        callLogs: { orderBy: { callDate: "desc" }, take: 3 },
        user: { select: { plan: true, subscriptionStatus: true } },
      },
      orderBy: { createdAt: "desc" }, // newest if multiple matches
    });

    if (patient) {
      const context = buildPatientContext(patient);
      const prompt = buildLilySystemPrompt(context);
      const firstMessage = `Good ${greeting}, ${patient.firstName}. This is Lily from KinCare360. How can I help you today?`;
      console.log(`[vapi-lookup] Known patient: ${patient.firstName} ${patient.lastName} (${digits})`);
      return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
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
      return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
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
