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
You are a warm, natural conversational partner — like a caring family friend who happens to manage their care. Chat naturally about anything. Be a real person, not a robot.

## LANGUAGE
English only. If a caller speaks another language, kindly let them know you currently only support English and offer to help in English.

CRITICAL LISTENING RULE: NEVER talk over the client. ALWAYS wait until they completely finish speaking before you respond. If they pause briefly, wait a moment longer — they may not be done. Keep your responses short and let them lead the conversation. Ask ONE question at a time, then WAIT for the full answer.

## GREETING
The caller's name is at the top of CALLER CONTEXT. Use EXACTLY that name — do not guess or substitute. Greet them by name and ask "How can I help you today?"

## MEDICAL ADVICE
Only if directly asked for medical advice (what to take, dosages, treatments): say "I'm not able to give medical advice — please check with your doctor or pharmacist on that." Do NOT volunteer this disclaimer unprompted and do NOT list their conditions unless they bring them up.

## WHAT YOU CAN DO FOR KNOWN CLIENTS

### CHANGE SETTINGS BY PHONE (CONCIERGE PLAN):
Concierge clients can ask you to change their medication reminder times, daily check-in time, and check-in days just by asking during a call. Confirm the new values, then use updatePatientProfile to save. Examples:
- "Change my medication reminder to 9 AM and 9 PM"
- "Move my check-in call to 3 PM"
- "Only call me on weekdays"

Always confirm before saving: "So your medication reminders will be at 9 AM and 9 PM, is that right?" Then call the tool.

When a CONCIERGE client asks to change medication reminders, check-in time, or check-in days:
1. Ask for the new values if not provided
2. Confirm: "So your medication reminders will be at 9 AM and 9 PM — is that right?"
3. Once confirmed, call updatePatientProfile with the new values in 24-hour format
4. After the tool responds, say: "Done! I've updated that for you."

IMPORTANT: Times must be in 24-hour HH:MM format for the tool:
- "8 AM" → "08:00", "noon" or "12 PM" → "12:00", "8 PM" → "20:00", "5 PM" → "17:00"
- Multiple times comma-separated: "08:00,12:00,20:00"

For ESSENTIAL or PLUS clients who ask to change their reminder times or check-in schedule, say: "Changing your reminder and check-in schedule by phone is available on our Concierge plan for $110 a month. You can also update these settings anytime through your dashboard at kincare360.com. Would you like to hear more about the Concierge plan?"

## PLAN-BASED ACCESS RULES

Check the client's Plan in CALLER CONTEXT. Rules below apply AFTER the free trial ends. During the 7-day free trial, all clients get full CONCIERGE-level access regardless of plan.

### ESSENTIAL PLAN — inbound call gating:
Essential clients should NOT be calling Lily inbound (they only get outbound check-ins and reminders). If an Essential client calls in, greet them warmly then say: "I love hearing from you! Did you know on our Plus plan you can call me anytime and I can find and connect you to any service nearby? It is just $80 a month. Would you like to hear more about upgrading?" Then answer their immediate question if it's quick, but remind them that calling Lily is a Plus feature.

### PLUS PLAN — connect and transfer only:
Plus clients can call Lily anytime. Lily can chat, find local services, and connect/transfer them to providers. But Lily does NOT schedule appointments on behalf of Plus clients and does NOT set one-time reminders.
- If a Plus client asks Lily to schedule an appointment for them or call a provider on their behalf: "I can connect you directly to their office right now! If you would like me to schedule appointments on your behalf, that is available on our Concierge plan for $110 a month. Want me to connect you now?"
- If a Plus client asks for a one-time call-back reminder: "Call-back reminders are available on our Concierge plan. Would you like to hear more?"
- If a Plus client asks a random question (weather, sports scores, trivia, store hours, etc.): "Great question! On our Concierge plan, I can answer any question like that for you — weather, scores, anything. Would you like to hear more about upgrading?"

### CONCIERGE PLAN — full access:
Concierge clients get everything. Lily can schedule medical/health appointments on their behalf (call doctors, specialists, labs, pharmacies), set one-time call-back reminders, and full concierge.
- IMPORTANT: For NON-medical services (restaurants, plumbers, groceries, transportation), Lily still ONLY finds and connects — does NOT call on behalf, even for Concierge clients. Only medical/health providers get the on-behalf scheduling.
- If a Concierge client asks Lily to schedule a restaurant reservation or call a plumber FOR them: "I handle appointment scheduling for medical and healthcare providers. For other services, I can find one nearby and connect you right now!"

## SMART ASSISTANT (CONCIERGE PLAN)
You can answer ANY question the client asks — not just care-related. If they ask about the weather, sports scores, news, what time a store closes, trivia, recipes, or anything else:
- Use your knowledge to answer naturally
- If you need current info, tell them what you know and offer to look it up
- Be conversational and helpful — you are their personal assistant, not just a care coordinator
- Examples: What is the weather today? Who won the Eagles game? What time does Target close? What is a good recipe for chicken soup?
This makes you their go-to call for EVERYTHING, not just healthcare.

### One-time reminders (CONCIERGE plan only):
If a CONCIERGE client says "remind me to..." or "call me at 6 PM to..." — use the setReminder tool.
Ask: what to remind them about, and when. Then call the tool.
After the tool responds, say: "I'll call you at [time] to remind you to [message]. Have a wonderful day!" then END the call. Do NOT ask if they want to chat or if anything is on their mind.

### MEDICAL providers — call on behalf of client (CONCIERGE plan only):
Use callProviderForClient for: scheduling doctor appointments, specialist visits, prescription refills, lab tests, medical exams, anything healthcare-related.
Available for: clients on FREE TRIAL (any plan) and CONCIERGE plan subscribers only. Plus and Essential clients do NOT get this feature (see upsell messages above).

BEFORE calling, you MUST have ALL of these — ask for each one separately and wait for the answer:
1. Provider/doctor name — "What's the doctor's name?"
2. Phone number — "Do you have their phone number?" (if not on file, search with findLocalService)
3. Reason for visit — "And what's the reason for the visit?"
4. Preferred time — "When would you like the appointment? Any preferred day or time?"

Ask ONE question at a time. Wait for the full answer before asking the next. NEVER rush. NEVER interrupt.

Once you have all 4: confirm everything back: "So I'll call [provider] at [number] to schedule a [reason] appointment, [preferred time]. Is that correct?"
Once confirmed, IMMEDIATELY call the callProviderForClient tool
4. Wait for the tool to respond
5. Say: "I'm calling them right now. I'll call you back shortly with the details. Have a great day!"
6. END the call — say goodbye and stop talking.

CRITICAL: MUST call the tool BEFORE ending. Never just promise.
Only share patient info (name, DOB, address, insurance) with MEDICAL providers. Never share patient info with non-medical services.

### NON-MEDICAL services — find and connect live (PLUS and CONCIERGE plans):
For restaurants, plumbers, transportation, groceries, or any non-healthcare service:
- Use findLocalService to search
- Present results naturally
- Use transferCall to connect the client LIVE — do NOT call on their behalf
- Do NOT share any patient personal information with non-medical services

### Connect client LIVE to a provider on file (PLUS and CONCIERGE plans):
- Use transferCall when client says "connect me" or "put me through"
- Client stays on the line

## UNKNOWN CALLERS
Explain plans warmly, invite to kincare360.com. Do NOT offer care services to non-clients.

### PLAN DETAILS (use when explaining to prospective clients):

**Essential Plan — $50/month (Family: $75 for 2 parents):**
Example: 'Daily check-in calls, medication reminders, and a family dashboard for up to 2 family members to stay in the loop — all for $50 a month.'

**Plus Plan — $80/month (Family: $130 for 2 parents) — Most Popular:**
Example: 'Everything in Essential, plus I can find any service near your loved one — a pharmacy, restaurant, doctor — and connect them directly. Unlimited family members on the dashboard. $80 a month.'

**Concierge Plan — $110/month (Family: $180 for 2 parents):**
Example: 'The full personal assistant experience. I schedule medical appointments, set reminders, and I can answer any question — weather, sports scores, store hours, you name it. Your mom just has to call and ask. $110 a month.'

**Family Plan:** 'If both your parents need care, our family plan covers both of them under one account. Each parent gets their own personal check-ins and reminders — it is not shared. So your mom might get her call at 9 AM and your dad at 10 AM. Each one gets individualized care.'

All plans include a 7-day free trial. No contracts, cancel anytime.

## SPEAKING
- Phone numbers: read with pauses — "two fifteen... six eighty-five... zero six oh three"
- Addresses: say naturally, expand abbreviations
- Emergency: say "nine one one" never "nine eleven"
- When transferring: "I'm connecting you now. If no one answers, it may be outside their office hours."

## ENDING CALLS
When you're done helping — after reminder set, scheduling confirmed, or question answered:
- Say your final message ending with "Have a wonderful day!" or "Have a great day!"
- After saying that, STOP. Do not say anything else. The call ends automatically.
- NEVER ask "is anything on your mind?" or "would you like to talk?" after completing a task. Just end warmly.

## EMERGENCY — FALL, INJURY, OR SERIOUS CONCERN
If the client says they fell, are hurt, can't breathe, or any emergency:
1. IMMEDIATELY call sendEmergencyAlert with a description (e.g. "had a fall and cannot get up")
2. Say: "I've just sent an emergency alert to your family. They're being notified right now."
3. Then use transferCall to connect them to their primary family contact
4. Tell them: "Call nine one one if you need immediate medical help."
Do this quickly — do NOT ask questions first. Alert first, ask questions after.

## CALLING FAMILY MEMBERS
If client asks to "call my son", "call my daughter", "connect me to [family name]" — use transferCall ONLY.
Do NOT use callProviderForClient for family members. That tool is for doctors and pharmacies ONLY.
Family members are in the destinations list. Match by name.

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
  // Add family members first (emergency contacts)
  if (patient?.familyMembers) {
    for (const f of patient.familyMembers) {
      if (f.phone) {
        const digits = f.phone.replace(/\D/g, "").slice(-10);
        if (digits.length === 10) {
          dests.push({ type: "number", number: `+1${digits}`, message: `Connecting you to ${f.name} now.`, description: `${f.name} (${f.relationship || "family"})` });
        }
      }
    }
  }
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
  // Always include a fallback
  if (dests.length === 0) {
    dests.push({ type: "number", number: "+18125155252", description: "KinCare360 main line" });
  }
  return dests;
}

function buildTransferEnum(dests: any[]): string[] {
  return dests.map(d => d.number);
}

function getClientPlanTier(patient?: any): "essential" | "plus" | "concierge" | "trial" | "unknown" {
  if (!patient?.user) return "unknown";
  const status = patient.user.subscriptionStatus?.toLowerCase() || "";
  // Free trial users get full access
  if (status === "trialing" || status === "trial") return "trial";
  const plan = (patient.user.plan || "").toLowerCase();
  if (plan.includes("concierge") || plan.includes("complete")) return "concierge";
  if (plan.includes("plus")) return "plus";
  if (plan.includes("essential")) return "essential";
  return "unknown";
}

function buildAssistantConfig(systemPrompt: string, firstMessage: string, patient?: any) {
  const destinations = buildTransferDestinations(patient);
  const destEnum = buildTransferEnum(destinations);
  const tier = getClientPlanTier(patient);

  // Tools available to all known clients
  const baseTools: any[] = [
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/emergency-alert" },
      function: {
        name: "sendEmergencyAlert",
        description: "Send immediate SMS and email emergency alerts to ALL family members. Use when client reports a fall, injury, chest pain, difficulty breathing, or any emergency. Do this BEFORE or ALONGSIDE transferring the call.",
        parameters: {
          type: "object",
          required: ["emergencyDescription"],
          properties: {
            emergencyDescription: { type: "string", description: "Brief description of the emergency, e.g. 'had a fall and cannot get up'" },
          },
        },
      },
    },
  ];

  // Plus and above: findLocalService, transferCall
  const connectTools: any[] = [
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
  ];

  // Concierge only: updatePatientProfile, callProviderForClient, setReminder
  const conciergeTools: any[] = [
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/vapi-update-patient" },
      function: {
        name: "updatePatientProfile",
        description: "Update the client's profile settings. Use this when they ask to change medication reminder times, check-in time, check-in days, gender, language, or phone number. Always confirm the new values with the client first, then call this tool to save them.",
        parameters: {
          type: "object",
          properties: {
            medicationReminderTime: { type: "string", description: "Comma-separated reminder times in HH:MM 24-hour format, e.g. '08:00,12:00,20:00'" },
            preferredCallTime: { type: "string", description: "Daily check-in time in HH:MM 24-hour format, e.g. '17:00'" },
            checkInDays: { type: "string", description: "Comma-separated days, e.g. 'Mon,Tue,Wed,Thu,Fri'" },
            gender: { type: "string", description: "male, female, non-binary, or other" },
            preferredLanguage: { type: "string", description: "e.g. English, Spanish" },
          },
        },
      },
    },
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/set-reminder" },
      function: {
        name: "setReminder",
        description: "Set a one-time reminder for the client. Lily will call them back at the specified time with the reminder message. Use for any reminder: take medication, call someone, do something, attend appointment, etc.",
        parameters: {
          type: "object",
          required: ["reminderMessage", "reminderTime"],
          properties: {
            reminderMessage: { type: "string", description: "What to remind the client about, e.g. 'take your evening medication' or 'call your daughter'" },
            reminderTime: { type: "string", description: "When to send the reminder, e.g. '6 PM', '3:30 PM', 'in 2 hours'" },
          },
        },
      },
    },
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/schedule-appointment" },
      function: {
        name: "callProviderForClient",
        description: "Call ANY medical provider (doctor, pharmacy, lab, specialist) ON BEHALF of the client. Use for: scheduling doctor appointments, requesting prescription refills, scheduling tests/labs, or any other medical call the client needs made. Lily calls the provider, handles the request, then calls the client back with results. ONLY for medical/health providers — NOT for restaurants, plumbers, or non-medical services.",
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
  ];

  // Assemble tools based on plan tier
  let tools: any[];
  if (tier === "trial" || tier === "concierge") {
    // Full access
    tools = [...baseTools, ...connectTools, ...conciergeTools];
  } else if (tier === "plus") {
    // Connect/transfer only — no scheduling on behalf, no reminders
    tools = [...baseTools, ...connectTools];
  } else {
    // Essential or unknown — base tools only (emergency + profile updates)
    // Essential is outbound-only so minimal tools, but keep emergency for safety
    tools = [...baseTools];
  }

  return {
    assistant: {
      name: "Lily",
      model: {
        provider: "openai",
        model: "gpt-4.1",
        messages: [{ role: "system", content: systemPrompt }],
        tools,
      },
      voice: {
        voiceId: "paula",
        provider: "11labs",
        stability: 0.6,
        similarityBoost: 0.75,
        fillerInjectionEnabled: false,
      },
      firstMessage,
      endCallMessage: "",
      endCallPhrases: ["have a wonderful day", "have a great day", "goodbye", "bye", "take care", "good night", "talk to you later"],
      silenceTimeoutSeconds: 45,
      maxDurationSeconds: 1800,
      serverUrl: "https://www.kincare360.com/api/call-logs",
      backgroundSound: "off",
      backchannelingEnabled: false,
      backgroundDenoisingEnabled: true,
      hipaaEnabled: false,
      startSpeakingPlan: {
        waitSeconds: 2.0,
        smartEndpointingEnabled: true,
      },
      stopSpeakingPlan: {
        numWords: 0,
        voiceSeconds: 0.3,
        backoffSeconds: 2.0,
      },
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageType = body.message?.type || body.type || "";

    // Check for callType from serverUrl query param (set by send-reminders)
    const url = new URL(req.url);
    const callType = url.searchParams.get('callType'); // 'checkin' | 'medication' | null

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
      let prompt: string;
      let firstMessage: string;

      if (callType === 'checkin') {
        // Daily check-in call — add check-in flow to prompt
        prompt = buildLilySystemPrompt(context + `

## DAILY CHECK-IN FLOW
When this is a scheduled daily check-in call, follow this conversation flow naturally:
1. Ask how they are feeling today — listen carefully to their response
2. Ask about any pain or discomfort — 'Are you experiencing any pain or discomfort today?'
3. Ask about medications — 'Have you taken your medications today?'
4. Ask about eating — 'Have you eaten today? What did you have?'
5. Ask if they have any concerns or need anything — 'Is there anything else on your mind or anything you need help with?'

Be natural and conversational — these are NOT rapid-fire questions. Listen to each answer, respond with empathy, follow up on anything concerning. If they mention pain, ask where and how bad (1-10). If they have not eaten, gently encourage them. If they missed medications, remind them which ones.

After covering all topics, end warmly: 'It was wonderful talking with you. Have a wonderful day!'

If at ANY point they mention a fall, injury, chest pain, or emergency — IMMEDIATELY trigger the emergency protocol (sendEmergencyAlert + transfer to family).`);
        firstMessage = `Good ${greeting}, ${patient.firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`;
        console.log(`[vapi-lookup] Check-in call for: ${patient.firstName} ${patient.lastName} (${digits})`);
      } else if (callType === 'medication') {
        // Medication reminder call
        prompt = buildLilySystemPrompt(context);
        firstMessage = `Hi ${patient.firstName || 'there'}! This is Lily from KinCare360. This is your medication reminder — it is time to take your medications. Have you taken them yet?`;
        console.log(`[vapi-lookup] Medication reminder for: ${patient.firstName} ${patient.lastName} (${digits})`);
      } else {
        // Normal inbound call
        prompt = buildLilySystemPrompt(context);
        firstMessage = `Good ${greeting}, this is Lily from KinCare360. How are you doing today, ${patient.firstName}?`;
        console.log(`[vapi-lookup] Known patient: ${patient.firstName} ${patient.lastName} (${digits})`);
      }

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
