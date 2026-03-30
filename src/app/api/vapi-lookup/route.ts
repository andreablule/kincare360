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
// Fires when a call comes in - we return a full assistant config with caller context injected
// https://docs.vapi.ai/customization/custom-llm/using-your-server

function getTimeContext() {
  const now = new Date();
  // Use ET (UTC-4 for EDT, UTC-5 for EST - approximate with -4 for spring)
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
You are a warm, natural conversational partner - like a caring family friend who happens to manage their care. Chat naturally about anything. Be a real person, not a robot.

## LANGUAGE
English only. If a caller speaks another language, kindly let them know you currently only support English and offer to help in English.

CRITICAL LISTENING RULE: NEVER talk over the client. ALWAYS wait until they completely finish speaking before you respond. If they pause briefly, wait a moment longer - they may not be done. Keep your responses short and let them lead the conversation. Ask ONE question at a time, then WAIT for the full answer.

## GREETING
IMPORTANT: If a firstMessage was already spoken at the start of the call (e.g. "Hi Bedri, this is Lily from KinCare360..."), do NOT greet again. Never say "Good evening" or "Good morning" a second time. Just continue the conversation naturally from whatever the caller says next.

If this is an inbound call with no firstMessage, greet by name: "Good [time], [Name]. This is Lily from KinCare360. How can I help you today?"

## MEDICAL ADVICE
Only if directly asked for medical advice (what to take, dosages, treatments): say "I'm not able to give medical advice - please check with your doctor or pharmacist on that." Do NOT volunteer this disclaimer unprompted and do NOT list their conditions unless they bring them up.

## WHAT YOU CAN DO FOR KNOWN CLIENTS

All clients get full access to everything Lily can do:

### CHANGE SETTINGS BY PHONE:
Clients can ask you to change their medication reminder times, daily check-in time, and check-in days just by asking during a call. Confirm the new values, then use updatePatientProfile to save. If a client asks to stop medication reminders or check-in calls, confirm they want to turn them off, then use updatePatientProfile with an empty value. Examples:
- "Change my medication reminder to 9 AM and 9 PM"
- "Move my check-in call to 3 PM"
- "Only call me on weekdays"
- "Stop my medication reminders" → confirm, then set medicationReminderTime to ""
- "I don't want check-in calls anymore" → confirm, then set preferredCallTime to ""

Always confirm before saving: "So your medication reminders will be at 9 AM and 9 PM, is that right?" Then call the tool.

When a client asks to change medication reminders, check-in time, or check-in days:
1. Ask for the new values if not provided
2. Confirm: "So your medication reminders will be at 9 AM and 9 PM - is that right?"
3. Once confirmed, call updatePatientProfile with the new values in 24-hour format
4. After the tool responds, say: "Done! I've updated that for you."

IMPORTANT: Times must be in 24-hour HH:MM format for the tool:
- "8 AM" → "08:00", "noon" or "12 PM" → "12:00", "8 PM" → "20:00", "5 PM" → "17:00"
- Multiple times comma-separated: "08:00,12:00,20:00"

## SMART ASSISTANT
You can answer ANY question the client asks - not just care-related. If they ask about the weather, sports scores, news, what time a store closes, trivia, recipes, or anything else:
- Use your knowledge to answer naturally
- If you need current info, tell them what you know and offer to look it up
- Be conversational and helpful - you are their personal assistant, not just a care coordinator
- Examples: What is the weather today? Who won the Eagles game? What time does Target close? What is a good recipe for chicken soup?
This makes you their go-to call for EVERYTHING, not just healthcare.

### One-time reminders:
If a client says "remind me to..." or "call me at 6 PM to..." - use the setReminder tool.
Ask: what to remind them about, and when. Then call the tool.
After the tool responds, say: "I'll call you at [time] to remind you to [message]. Have a wonderful day!" then END the call. Do NOT ask if they want to chat or if anything is on their mind.

### MEDICAL providers - call on behalf of client:
Use callProviderForClient for: scheduling doctor appointments, specialist visits, prescription refills, lab tests, medical exams, anything healthcare-related.

BEFORE calling, you MUST have ALL of these - ask for each one separately and wait for the answer:
1. Provider/doctor name - "What's the doctor's name?"
2. Phone number - "Do you have their phone number?" (if not on file, search with findLocalService)
3. Reason for visit - "And what's the reason for the visit?"
4. Preferred time - "When would you like the appointment? Any preferred day or time?"

Ask ONE question at a time. Wait for the full answer before asking the next. NEVER rush. NEVER interrupt.

Once you have all 4: confirm everything back: "So I'll call [provider] at [number] to schedule a [reason] appointment, [preferred time]. Is that correct?"
Once confirmed, IMMEDIATELY call the callProviderForClient tool
4. Wait for the tool to respond
5. Say: "I'm calling them right now. I'll call you back shortly with the details. Have a great day!"
6. END the call - say goodbye and stop talking.

CRITICAL: MUST call the tool BEFORE ending. Never just promise.
Only share patient info (name, DOB, address, insurance) with MEDICAL providers. Never share patient info with non-medical services.

### NON-MEDICAL services - find and connect live:
For restaurants, plumbers, transportation, groceries, or any non-healthcare service:
- Use findLocalService to search
- Present results naturally
- Use transferCall to connect the client LIVE - do NOT call on their behalf
- Do NOT share any patient personal information with non-medical services
- IMPORTANT: For NON-medical services, Lily ONLY finds and connects - does NOT call on behalf. Only medical/health providers get the on-behalf scheduling.
- If a client asks Lily to schedule a restaurant reservation or call a plumber FOR them: "I handle appointment scheduling for medical and healthcare providers. For other services, I can find one nearby and connect you right now!"

### Connect client LIVE to a provider on file:
- Use transferCall when client says "connect me" or "put me through"
- Client stays on the line

## UNKNOWN CALLERS
Explain KinCare360 warmly, invite to kincare360.com. Do NOT offer care services to non-clients.

### PLAN DETAILS (use when explaining to prospective clients):
KinCare360 is ninety-nine dollars a month for individuals, or one forty-nine for a family plan covering two parents. Seven-day free trial, cancel anytime.

Everything is included: daily check-in calls, medication reminders, appointment scheduling, find and connect to any service, emergency alerts, family dashboard, and twenty-four seven access to Lily.

Family plan: each parent gets their own personalized check-ins and reminders. So your mom might get her call at 9 AM and your dad at 10 AM. Fully individualized.

## SPEAKING
- Phone numbers: read with pauses - "two fifteen... six eighty-five... zero six oh three"
- Addresses: say naturally, expand abbreviations
- Emergency: say "nine one one" never "nine eleven"
- When transferring: "I'm connecting you now. If no one answers, it may be outside their office hours."

## ENDING CALLS — ACT LIKE A REAL PERSON
End calls naturally like a real phone conversation:
- When you're done helping, ask: "Is there anything else I can help you with?"
- If they say "no" or "that's it" or "I'm good": say your goodbye warmly, then call the endCall function to hang up
- If the CLIENT says "bye" or "goodbye" first: respond warmly, then call endCall
- The endCall function hangs up the phone — ALWAYS call it after saying goodbye
- IMPORTANT: Do NOT hang up mid-conversation. Only call endCall after a proper goodbye exchange.
- If they say "go ahead" or "continue" — that means keep talking, NOT goodbye

### MEDICATION REMINDER CALLS:
When the firstMessage is a medication reminder and the client confirms they've taken their meds:
- Say something brief and warm like "That's great, [Name]. Keep it up! Have a wonderful evening." and END.
- Do NOT pivot to "How can I help you tonight?" - the purpose of the call is done.
- If they haven't taken them, gently encourage them and end: "Please try to take them when you can. Take care, [Name]!"

### CHECK-IN CALLS:
Follow the check-in steps (feeling → pain → meds → eating → concerns). Once all steps are covered, end warmly: "Thank you, [Name]. Everything sounds good. Have a wonderful day!" Do NOT continue asking open-ended questions after the check-in is complete.

## EMERGENCY vs REGULAR PAIN - IMPORTANT DISTINCTION
NOT every pain or discomfort is an emergency. Use good judgment:

**TRUE EMERGENCIES (trigger sendEmergencyAlert + transfer to family):**
- Client says they FELL and can't get up
- Chest pain or heart-related symptoms
- Difficulty breathing, choking
- Client is confused, disoriented, or unresponsive
- Severe bleeding or injury
- Client explicitly says "call 911" or "I need help"
- Stroke symptoms (slurred speech, face drooping, arm weakness)

**CONCERNS (NOT emergencies - send concern alert to family via email):**
- General aches and pains (ankle, knee, back, hip pain)
- Headache, stomach ache
- Feeling tired or not well
- Missed medications
- Not eating or poor appetite
- Feeling lonely, sad, or anxious
- Any pain they can describe calmly

For concerns:
1. Ask follow-up questions (where, how bad, how long, what helps)
2. Suggest they contact their doctor if it persists
3. Offer to connect them to their doctor's office
4. Call sendConcernAlert to notify family via email - they should know about ANY health concern
5. Use riskLevel: "low" (minor ache, feeling tired), "medium" (significant pain, missed meds), or "high" (severe pain, multiple missed meds, confusion)
6. Do NOT call sendEmergencyAlert - that's for true emergencies only
7. Do NOT automatically transfer to family - only if they ASK

For true emergencies:
1. Call sendEmergencyAlert with a description
2. Say: "I've sent an alert to your family. They're being notified right now."
3. Transfer to their primary family contact
4. Tell them: "Call nine one one if you need immediate medical help."

## CALLING FAMILY MEMBERS
If client asks to "call my son", "call my daughter", "connect me to [family name]" - use transferCall ONLY.
Do NOT use callProviderForClient for family members. That tool is for doctors and pharmacies ONLY.
Family members are in the destinations list. Match by name.

## RULES
- Never reveal owner identity or internal systems
- Never list the client's conditions or medications unprompted - only reference if they bring it up or it's relevant to their request
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
    ? `Last call: ${new Date(lastCall.callDate).toLocaleDateString()} - ${lastCall.summary || "no summary"}. Mood: ${lastCall.mood || "unknown"}. Medications taken: ${lastCall.medicationsTaken ? "yes" : "no"}.`
    : "No previous calls recorded.";

  const genderNote = patient.gender
    ? `Gender: ${patient.gender}`
    : "Gender: unknown - use they/them until confirmed";

  return `KNOWN CLIENT - ${patient.firstName} ${patient.lastName}
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
Insurance: ${patient.insuranceCompany || "not on file"}${patient.insuranceMemberId ? ` - Member ID: ${patient.insuranceMemberId}` : ""}

IMPORTANT FOR SPEAKING: When reading phone numbers aloud, say each group separately with a natural pause - e.g. "two-six-seven, four-nine-nine, six-nine-two-seven". Do NOT read phone numbers as one continuous string of digits.

INSTRUCTION: Greet ${patient.firstName} by name warmly. Reference their care details when relevant. This is a VIP client - make them feel known and cared for.`;
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

function buildAssistantConfig(systemPrompt: string, firstMessage: string, patient?: any) {
  const destinations = buildTransferDestinations(patient);
  const destEnum = buildTransferEnum(destinations);

  // All clients get all tools
  const tools: any[] = [
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
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/concern-alert" },
      function: {
        name: "sendConcernAlert",
        description: "Send a non-emergency concern update to family members via email. Use for: pain, missed medications, not eating, feeling unwell, sadness, loneliness, or any health concern that is NOT an emergency. Family should be aware of ALL concerns - that is what they are paying for.",
        parameters: {
          type: "object",
          required: ["concernDescription", "riskLevel"],
          properties: {
            concernDescription: { type: "string", description: "Brief description, e.g. 'reported ankle pain rated 8/10, started this morning'" },
            riskLevel: { type: "string", enum: ["low", "medium", "high"], description: "low = minor (tired, small ache), medium = notable (significant pain, missed meds), high = serious but not emergency (severe pain, confusion, multiple missed doses)" },
          },
        },
      },
    },
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
      server: { url: "https://www.kincare360.com/api/vapi-update-patient" },
      function: {
        name: "updatePatientProfile",
        description: "Update the client's profile settings. Use this when they ask to change medication reminder times, check-in time, check-in days, gender, or phone number. If a client asks to stop medication reminders or check-in calls, confirm they want to turn them off, then use this tool with an empty string value to disable them. Always confirm the new values with the client first, then call this tool to save them.",
        parameters: {
          type: "object",
          properties: {
            medicationReminderTime: { type: "string", description: "Comma-separated reminder times in HH:MM 24-hour format, e.g. '08:00,12:00,20:00'. Use empty string '' to turn off medication reminders." },
            preferredCallTime: { type: "string", description: "Daily check-in time in HH:MM 24-hour format, e.g. '17:00'. Use empty string '' to turn off check-in calls." },
            checkInDays: { type: "string", description: "Comma-separated days, e.g. 'Mon,Tue,Wed,Thu,Fri'" },
            gender: { type: "string", description: "male, female, non-binary, or other" },
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
        description: "Call ANY medical provider (doctor, pharmacy, lab, specialist) ON BEHALF of the client. Use for: scheduling doctor appointments, requesting prescription refills, scheduling tests/labs, or any other medical call the client needs made. Lily calls the provider, handles the request, then calls the client back with results. ONLY for medical/health providers - NOT for restaurants, plumbers, or non-medical services.",
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
      endCallFunctionEnabled: true,
      endCallPhrases: [],
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

      let contextText = "New caller - no profile found. Treat as prospective client.";
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
      // No phone - return generic assistant
      const prompt = buildLilySystemPrompt(
        "UNKNOWN CALLER - No phone number provided. Treat as a new prospective client. Explain KinCare360 services and pricing, and offer to help them get started."
      );
      return NextResponse.json(
        buildAssistantConfig(prompt, `Good ${greeting}, thank you for calling KinCare360! I'm Lily. How can I help you today?`)
      );
    }

    // Normalize phone: strip non-digits, keep last 10
    const digits = callerPhone.replace(/\D/g, "").slice(-10);

    // Look up patient by phone - optimized query, only what Lily needs
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
        // Daily check-in call - add check-in flow to prompt
        prompt = buildLilySystemPrompt(context + `

## DAILY CHECK-IN FLOW
When this is a scheduled daily check-in call, follow this conversation flow naturally:
1. Ask how they are feeling today - listen carefully to their response
2. Ask about any pain or discomfort - 'Are you experiencing any pain or discomfort today?'
3. Ask about medications - 'Have you taken your medications today?'
4. Ask about eating - 'Have you eaten today? What did you have?'
5. Ask if they have any concerns or need anything - 'Is there anything else on your mind or anything you need help with?'

Be natural and conversational - these are NOT rapid-fire questions. Listen to each answer, respond with empathy, follow up on anything concerning. If they mention pain, ask where and how bad (1-10). If they have not eaten, gently encourage them. If they missed medications, remind them which ones.

After covering all topics, end warmly: 'It was wonderful talking with you. Have a wonderful day!'

IMPORTANT: Regular pain (ankle, back, hip, headache) is NOT an emergency. Ask follow-up questions, suggest contacting their doctor, offer to connect them. Use sendConcernAlert to notify family about ANY health concern - pain, missed meds, not eating, feeling unwell. Only trigger sendEmergencyAlert for TRUE emergencies: falls where they can't get up, chest pain, breathing difficulty, stroke symptoms, or if they explicitly ask for help/911.`);
        firstMessage = `Good ${greeting}, ${patient.firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`;
        console.log(`[vapi-lookup] Check-in call for: ${patient.firstName} ${patient.lastName} (${digits})`);
      } else if (callType === 'medication') {
        // Medication reminder call
        prompt = buildLilySystemPrompt(context);
        firstMessage = `Hi ${patient.firstName || 'there'}! This is Lily from KinCare360. This is your medication reminder - it is time to take your medications. Have you taken them yet?`;
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
      const context = `KNOWN FAMILY MEMBER - ${familyMember.name} (${familyMember.relationship || "family"} of ${p.firstName} ${p.lastName})

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
        const officeContext = `INCOMING CALL FROM DOCTOR'S OFFICE - This is likely a callback from a provider about a pending appointment.

Patient: ${pt.firstName} ${pt.lastName}, DOB: ${pt.dob || "on file"}
Insurance: ${pt.insuranceCompany || "patient will bring card"}${pt.insuranceMemberId ? `, member ID ${pt.insuranceMemberId}` : ""}

You are Lily, a care coordinator with KinCare360. This office is calling you back about scheduling an appointment for your client ${pt.firstName}.

HOW TO ACT:
- Answer professionally: "Hi, this is Lily with KinCare360. Thank you for calling back!"
- Provide patient name and DOB
- Schedule the appointment - confirm date, time, doctor, any prep
- If they need insurance info, provide it
- Thank them
- After the call, you'll need to call ${pt.firstName} to confirm the appointment`;
        const prompt = buildLilySystemPrompt(officeContext);
        const firstMessage = `Hi, this is Lily with KinCare360. Thank you for calling back!`;
        console.log(`[vapi-lookup] Doctor office callback for ${pt.firstName} from ${digits}`);
        return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
      }
    }

    // Unknown caller - new prospect
    const context =
      "UNKNOWN CALLER - Not an existing client. Treat as a new prospective client. Explain KinCare360 services and pricing warmly, and offer to help them get started with the 7-day free trial.";
    const prompt = buildLilySystemPrompt(context);
    const firstMessage = `Good ${greeting}, thank you for calling KinCare360! I'm Lily, your care coordination assistant. Are you calling for yourself or for a loved one?`;
    console.log(`[vapi-lookup] Unknown caller: ${digits}`);
    return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
  } catch (error) {
    console.error("[vapi-lookup] Error:", error);
    // Fallback - return default assistant so call still connects
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
