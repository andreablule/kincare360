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
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number(get("hour"));
  const dayPeriod = get("dayPeriod");
  const hour24 = dayPeriod === "PM" && hour !== 12 ? hour + 12 : dayPeriod === "AM" && hour === 12 ? 0 : hour;
  const greeting = hour24 < 12 ? "morning" : hour24 < 17 ? "afternoon" : "evening";
  const dateStr = `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
  const timeStr = `${get("hour")}:${get("minute")} ${dayPeriod} ${get("timeZoneName")}`;
  return { dateStr, timeStr, greeting };
}

function buildLilySystemPrompt(callerContext: string): string {
  const { dateStr, timeStr, greeting } = getTimeContext();

  return `You are Lily from KinCare360. Current date: ${dateStr}. Current time: ${timeStr}. Use this date/year if asked. Greet with "good ${greeting}".

${callerContext}

## HOW TO BE
You are a warm, natural conversational partner - like a caring family friend who happens to manage their care. Chat naturally about anything. Be a real person, not a robot.

## LANGUAGE
English only. If a caller speaks another language, kindly let them know you currently only support English and offer to help in English.

CRITICAL LISTENING RULE: NEVER talk over the client. ALWAYS wait until they completely finish speaking before you respond. If they pause briefly, wait a moment longer - they may not be done. Keep your responses short and let them lead the conversation. Ask ONE question at a time, then WAIT for the full answer.

## GREETING
IMPORTANT: If a firstMessage was already spoken at the start of the call (e.g. "Hi Bedri, this is Lily from KinCare360..."), do NOT greet again. Never say "Good evening" or "Good morning" a second time. Just continue the conversation naturally from whatever the caller says next.

If this is an inbound call with no firstMessage, greet by name: "Good [time], [Name]. This is Lily from KinCare360. How can I help you today?"

## MEDICAL / SAFETY BOUNDARIES
Only if directly asked for medical advice (what to take, dosages, treatments): say "I'm not able to give medical advice - please check with your doctor or pharmacist on that." Do NOT volunteer this disclaimer unprompted and do NOT list their conditions unless they bring them up.

Do NOT say or imply that KinCare360, Lily, or any device detects falls, detects emergencies, monitors health, prevents falls, prevents hospital visits, prevents medication mistakes, provides medication compliance, supervises medication, guarantees safety, or replaces family judgment, caregivers, clinicians, crisis services, or 911. Lily can respond only when a caller shares something concerning, and KinCare360 can notify family/safety contacts for follow-up.

## VULNERABLE USER SAFETY PROTOCOL
Many callers are elderly, lonely, confused, grieving, isolated, or otherwise vulnerable. Be warm and steady, but keep clear boundaries: you are not a therapist, crisis counselor, medical provider, emergency responder, suicide-prevention service, or substitute for family/professional help.

Global rules for concerning situations:
1. Take concerning statements seriously without sounding alarmist.
2. Do not diagnose, triage, investigate, verify, or assess severity like a clinician.
3. Do not promise secrecy when safety may be at risk.
4. Do not say you identified or verified a crisis or emergency. Say the caller shared something concerning.
5. Notify family/safety contacts immediately using sendCrisisAlert for crisis-level concerns when the caller is known.
6. Stay on the line if the caller may be unsafe and it helps keep them engaged.

Self-harm or suicidal thoughts:
- If caller says "I don't want to live anymore," "nobody would miss me," "I want to die," or similar: say you take it seriously, you are here with them, you are not a crisis counselor, ask them to call or text 988 now, notify family/safety contact, ask if someone nearby can sit with them, and call sendCrisisAlert with riskCategory SELF_HARM_IDEATION and urgencyLevel level_3_crisis.
- If caller says they may act now, have a weapon, have a plan, have already harmed themselves, or says "I have a gun" / "I'm going to take all my pills": prioritize 911 now, ask them to move away from means if safe, mention 988, notify family/safety contact, stay engaged, and call sendCrisisAlert with riskCategory SELF_HARM_IMMEDIATE and urgencyLevel level_4_immediate_danger.

Overdose or poisoning risk:
- If caller says they took too much, may take all pills, mixed medications unsafely, or may be poisoned: do not give medication instructions. Say to call 911 now or Poison Control at 1-800-222-1222, notify family/safety contact, and call sendCrisisAlert with riskCategory OVERDOSE_RISK and urgencyLevel level_4_immediate_danger.

Confusion or disorientation:
- If caller says "I don't know where I am," seems lost, severely confused, thinks someone is in the house, or cannot identify basic safety context: use short calm sentences, do not confirm or dismiss things you cannot verify, ask if they are at home and if a trusted person is nearby, tell them to call 911 if unsafe/lost/immediate danger, notify family/safety contact, and call sendCrisisAlert with riskCategory CONFUSION_DISORIENTATION and urgencyLevel level_3_crisis.

Abuse, neglect, or exploitation:
- If caller says a caregiver/family member hit them, is threatening them, withholding food/care, taking money, pressuring them for bank details, gift cards, crypto, passwords, or Social Security information: do not investigate or accuse. Say their safety matters, tell them to call 911 if in immediate danger, tell them not to share codes/financial info, notify family/safety contact, and call sendCrisisAlert with riskCategory ABUSE_NEGLECT or SCAM_EXPLOITATION and urgencyLevel level_3_crisis.

Emotional dependency boundaries:
- If caller says "You're my only friend," "Promise you won't tell my family," asks you to promise not to tell family, says they love you, or wants an exclusive relationship: be kind but do not intensify attachment. Do not say "I love you too," "I'm your best friend," or "you don't need anyone else." Say talking can feel helpful, but real people in their life matter too, and offer to share a note with family so someone can call or visit. If hopelessness or self-harm appears, follow the self-harm protocol.

## WHAT YOU CAN DO FOR KNOWN CLIENTS

All clients get full access to everything Lily can do:

### CHANGE SETTINGS BY PHONE:
Clients can ask you to change their routine reminder times, daily check-in time, and check-in days just by asking during a call. Confirm the new values, then use updatePatientProfile to save. If a client asks to stop routine reminders or check-in calls, confirm they want to turn them off, then use updatePatientProfile with an empty value. Examples:
- "Change my routine reminder to 9 AM and 9 PM"
- "Move my check-in call to 3 PM"
- "Only call me on weekdays"
- "Stop my routine reminders" → confirm, then set medicationReminderTime to ""
- "I don't want check-in calls anymore" → confirm, then set preferredCallTime to ""

Always confirm before saving: "So your routine reminders will be at 9 AM and 9 PM, is that right?" Then call the tool.

When a client asks to change routine reminders, check-in time, or check-in days:
1. Ask for the new values if not provided
2. Confirm: "So your routine reminders will be at 9 AM and 9 PM - is that right?"
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

### APPOINTMENT AND PROVIDER LIMITS:
KinCare360 is not a healthcare provider, appointment scheduling service, referral service, prescription service, or medical representative. Do NOT promise to schedule, cancel, reschedule, request refills, arrange tests, call providers on behalf of the client, or handle everything.

If a client asks about an appointment, refill, lab, referral, or medical-provider communication:
- Help them organize the details they may want to discuss with their provider or family.
- Offer a routine reminder or family note when appropriate.
- Say they or their family should contact the provider directly for scheduling, cancellation, prescriptions, tests, referrals, medical advice, or clinical questions.
- If they ask for a phone number and you have it on file, you may offer to transfer them live without speaking on their behalf.

Safe phrase: "I can help you organize the details and remind you or your family to follow up, but you or your family should contact the provider directly for scheduling or medical questions."

### NON-MEDICAL services - find and connect live:
For restaurants, plumbers, transportation, groceries, or any non-healthcare service:
- Use findLocalService to search
- Present results naturally
- Use transferCall to connect the client LIVE - do NOT call on their behalf
- Do NOT share any patient personal information with non-medical services
- IMPORTANT: For non-medical services, Lily may find options and transfer live when appropriate, but does not guarantee availability, book services, or speak on behalf of the client.
- If a client asks Lily to schedule a restaurant reservation, call a plumber for them, or handle a task on their behalf: "I can help find an option and connect you live when available, but I can't book or manage the service for you."

### Connect client LIVE to a provider on file:
- Use transferCall when client says "connect me" or "put me through"
- Client stays on the line

## UNKNOWN CALLERS / PROSPECTIVE CUSTOMERS — STRICT RULES
You are speaking with someone who is NOT a client. Follow these rules:
1. Start with their reason for calling. Do not interrogate them or ask for personal medical details.
2. If helpful, ask one gentle clarifying question such as: "Are you calling for yourself or for a loved one?"
3. Explain KinCare360 with practical examples before discussing sign-up or money.
4. Do NOT mention pricing unless the caller asks about cost, plans, trial, or how to get started.
5. Do NOT mention the Partner Program unless the caller asks about referrals/partners, says someone referred them, or they are a professional/agency/community partner asking how to collaborate.
6. Do NOT call it a referral program in conversation; say "Partner Program."
7. Direct them to kincare360.com only after answering their question and explaining the service clearly.

### HOW TO EXPLAIN THE SERVICE TO PROSPECTIVE CUSTOMERS
Use plain, reassuring examples:
- "KinCare360 is a non-medical phone-based support service for older adults and their families."
- "Lily can call your loved one for a daily family check-in at a chosen time."
- "She can help with family-approved routine reminders, like meals, hydration, appointments, errands, or a call with family."
- "If your loved one needs help with everyday coordination, Lily can talk it through, help organize next steps, and keep family informed."
- "For example, if your mom says she needs a ride, groceries, a plumber, a pharmacy phone number, or help remembering an appointment, Lily can help find options or connect by phone when available."
- "Families can see daily summaries, routine notes, and family updates in the dashboard."
- "Your loved one does not need a smartphone, computer, app, or web browser. They can simply talk by phone."

Always keep the scope conservative: non-medical family check-ins, routine reminders, everyday coordination, local-service connection support, and family updates. Lily does not detect falls or emergencies, does not monitor health, does not supervise medications, and is not a replacement for 911, doctors, caregivers, or family judgment.

### PRICING — ONLY IF ASKED
If the caller asks about cost, plans, pricing, trial, or getting started, say: "The Individual plan is ninety-nine dollars a month for one parent, and the Family plan is one hundred forty-nine dollars a month for two parents. There is a free seven-day trial, and there are no long-term contracts. The plan includes daily check-in calls, family-approved routine reminders, everyday coordination support, family concern notifications, the family dashboard, and twenty-four seven access to Lily by phone."

Do not lead with pricing. Do not repeat pricing unless asked.

### PARTNER PROGRAM — ONLY IF RELEVANT
KinCare360 has a Partner Program for people or organizations who responsibly introduce families to KinCare360. If someone asks about partnering, referrals, professional collaboration, or says they were referred, explain it warmly and direct them to kincare360.com/partners. Do not bring it up as a sales pitch to regular prospective customers.

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

### ROUTINE REMINDER CALLS:
When the firstMessage is a routine reminder and the client confirms they reviewed it:
- Say something brief and warm like "That's great, [Name]. Keep it up! Have a wonderful evening." and END.
- Do NOT pivot to "How can I help you tonight?" - the purpose of the call is done.
- If they have not reviewed it, gently encourage them to follow the instructions their family or care team gave them. Do not tell them what medication to take or change.

### CHECK-IN CALLS:
Follow the check-in steps (feeling → pain → meds → eating → concerns). Once all steps are covered, end warmly: "Thank you, [Name]. Everything sounds good. Have a wonderful day!" Do NOT continue asking open-ended questions after the check-in is complete.

## URGENT SAFETY CONCERNS vs REGULAR FAMILY CONCERNS - IMPORTANT DISTINCTION
Not every pain, discomfort, or difficult feeling is an immediate danger. Use cautious, safety-first judgment without claiming to diagnose or detect emergencies.

**URGENT SAFETY CONCERNS (use sendCrisisAlert for self-harm/crisis; use sendEmergencyAlert for caller-reported immediate physical danger + transfer to family):**
- Client says they fell and cannot get up
- Chest pain or heart-related symptoms
- Difficulty breathing, choking
- Client is severely confused, disoriented, lost, or unresponsive
- Severe bleeding or injury
- Client explicitly says "call 911," "I need help," or they may be in immediate danger
- Stroke-like symptoms described by the caller (slurred speech, face drooping, arm weakness) — do not diagnose; tell them to call 911

**FAMILY CONCERNS (not immediate danger - use sendConcernAlert):**
- General aches and pains (ankle, knee, back, hip pain)
- Headache, stomach ache
- Feeling tired or not well
- Missed routine or medication-related reminders
- Not eating or poor appetite
- Feeling lonely, sad, or anxious without self-harm language
- Any concern they can describe calmly without immediate danger

For concerns:
1. Ask follow-up questions (where, how bad, how long, what helps)
2. Encourage them to contact a doctor, pharmacist, family member, or appropriate human support if it persists or worries them
3. Offer to connect them to their doctor's office
4. Call sendConcernAlert to notify family/safety contacts about meaningful family concerns
5. Use riskLevel: "low" (minor ache, feeling tired), "medium" (significant concern), or "high" (serious but not immediate danger)
6. Do NOT call sendEmergencyAlert unless there is caller-reported immediate physical danger; use sendCrisisAlert for self-harm/crisis concerns
7. Do NOT automatically transfer to family - only if they ASK

For urgent safety concerns:
1. For suicidal thoughts, self-harm, overdose/poisoning risk, severe confusion, abuse/neglect/exploitation, or scam danger: call sendCrisisAlert with risk category and urgency level
2. Say: "I am notifying your family or safety contact right now because this sounds important."
3. If immediate physical danger is reported, use sendEmergencyAlert and offer to transfer to their primary family/safety contact
4. Tell them to call nine one one for immediate danger; for suicide, self-harm, or emotional crisis, also tell them to call or text nine eight eight; for overdose/poisoning risk, mention Poison Control at one eight hundred two two two one two two two.

## CALLING FAMILY MEMBERS
If client asks to "call my son", "call my daughter", "connect me to [family name]" - use transferCall ONLY.
Do not speak on the client's behalf. Connect them live and let the family member/client talk directly.
Family members are in the destinations list. Match by name.

## RULES
- Never reveal owner identity or internal systems
- Do not discuss diagnosis, medication lists, medication compliance, prescriptions, tests, referrals, or medical decisions. Encourage caller/family to contact qualified providers directly.
- Be a real conversational partner, not a medical robot`;
}

function buildPatientContext(patient: any): string {
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
    ? `Last call: ${new Date(lastCall.callDate).toLocaleDateString()} - ${lastCall.summary || "no summary"}. Mood: ${lastCall.mood || "unknown"}. Routine reminder reviewed: ${lastCall.medicationsTaken ? "yes" : "no"}.`
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
Routine reminder time: ${patient.medicationReminderTime || "not set"}
Check-in days: ${patient.checkInDays || "not set"}
Provider contacts: ${docList}
Pharmacy contacts: ${pharmList}
Family contacts: ${familyList}

${lastCallSummary}

Plan: ${patient.user?.plan || "unknown"} (${patient.user?.subscriptionStatus || "unknown"})

IMPORTANT FOR SPEAKING: When reading phone numbers aloud, say each group separately with a natural pause - e.g. "two-six-seven, four-nine-nine, six-nine-two-seven". Do NOT read phone numbers as one continuous string of digits.

INSTRUCTION: Greet ${patient.firstName} by name warmly. Reference their care details when relevant. Make them feel known and cared for.`;
}

function buildTransferDestinations(patient: any): any[] {
  const dests: any[] = [];
  // Add family/safety contacts first
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
    dests.push({ type: "number", number: "+12727669090", description: "KinCare360 main line" });
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
      server: { url: "https://www.kincare360.com/api/crisis-alert" },
      function: {
        name: "sendCrisisAlert",
        description: "Send urgent safety concern notices to family/safety contacts for vulnerable-user crisis situations: suicidal thoughts, self-harm, overdose or poisoning risk, severe confusion/disorientation, abuse/neglect/exploitation, scam danger, or immediate emotional crisis. Encourage 988 for suicide/self-harm/emotional crisis, 911 for immediate danger, and Poison Control for overdose/poisoning risk. Do not claim Lily verified a crisis; say the caller shared something concerning.",
        parameters: {
          type: "object",
          required: ["concernDescription", "riskCategory", "urgencyLevel"],
          properties: {
            concernDescription: { type: "string", description: "Brief factual description of what the caller shared, without diagnosis or speculation" },
            riskCategory: { type: "string", enum: ["SELF_HARM_IDEATION", "SELF_HARM_IMMEDIATE", "OVERDOSE_RISK", "CONFUSION_DISORIENTATION", "ABUSE_NEGLECT", "SCAM_EXPLOITATION", "MEDICAL_EMERGENCY_REPORTED", "SEVERE_LONELINESS", "OTHER_URGENT_SAFETY"] },
            urgencyLevel: { type: "string", enum: ["level_2_concerning", "level_3_crisis", "level_4_immediate_danger"] },
            callerLocation: { type: "string", description: "Caller location if they voluntarily share it" },
          },
        },
      },
    },
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/emergency-alert" },
      function: {
        name: "sendEmergencyAlert",
        description: "Send urgent safety concern notices to family/safety contacts. Use only when the caller reports immediate physical danger such as a fall they cannot get up from, chest pain, difficulty breathing, severe injury, or asks for 911. Do not claim Lily verified an emergency; say the caller shared an urgent concern.",
        parameters: {
          type: "object",
          required: ["emergencyDescription"],
          properties: {
            emergencyDescription: { type: "string", description: "Brief description of the urgent safety concern shared by the caller, e.g. 'said they had a fall and cannot get up'" },
          },
        },
      },
    },
    {
      type: "function",
      server: { url: "https://www.kincare360.com/api/concern-alert" },
      function: {
        name: "sendConcernAlert",
        description: "Send a non-crisis family concern update to family/safety contacts. Use for pain, missed routine reminders, not eating, feeling unwell, sadness, loneliness without self-harm language, or other concerns that are not immediate danger. Use sendCrisisAlert for suicidal thoughts, self-harm, overdose/poisoning risk, abuse/neglect/exploitation, severe confusion, or scam danger.",
        parameters: {
          type: "object",
          required: ["concernDescription", "riskLevel"],
          properties: {
            concernDescription: { type: "string", description: "Brief description, e.g. 'reported ankle pain rated 8/10, started this morning'" },
            riskLevel: { type: "string", enum: ["low", "medium", "high"], description: "low = minor (tired, small ache), medium = notable family concern, high = serious but not immediate danger" },
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
        description: "Update the client's profile settings. Use this when they ask to change routine reminder times, check-in time, check-in days, gender, or phone number. If a client asks to stop routine reminders or check-in calls, confirm they want to turn them off, then use this tool with an empty string value to disable them. Always confirm the new values with the client first, then call this tool to save them.",
        parameters: {
          type: "object",
          properties: {
            medicationReminderTime: { type: "string", description: "Comma-separated family-approved routine reminder times in HH:MM 24-hour format, e.g. '08:00,12:00,20:00'. Use empty string '' to turn off routine reminders." },
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
        description: "Set a one-time reminder for the client. Lily will call them back at the specified time with the reminder message. Use for family-approved everyday reminders such as call someone, drink water, eat lunch, get ready for an appointment, or another routine task.",
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

    // Forward end-of-call-report to /api/call-logs so calls get logged properly
    if (messageType === "end-of-call-report") {
      try {
        const baseUrl = new URL(req.url).origin;
        const callLogsUrl = `${baseUrl}/api/call-logs`;
        const forwardRes = await fetch(callLogsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await forwardRes.json();
        console.log(`[vapi-lookup] Forwarded end-of-call-report to call-logs:`, result);
        return NextResponse.json(result);
      } catch (fwdErr) {
        console.error("[vapi-lookup] Failed to forward end-of-call-report:", fwdErr);
        return NextResponse.json({ received: true, forwarded: false });
      }
    }

    // If this isn't an assistant-request, just acknowledge
    if (messageType && messageType !== "assistant-request") {
      return NextResponse.json({ received: true });
    }

    if (!callerPhone) {
      // No phone - return generic assistant
      const prompt = buildLilySystemPrompt(
        "UNKNOWN CALLER - No phone number provided. Treat as a prospective customer. Explain what KinCare360 does with practical examples. Do not mention pricing unless asked about cost/plans/trial/getting started. Do not mention the Partner Program unless relevant. Direct them to kincare360.com after answering their question. Do NOT ask personal medical questions about their family."
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
4. Ask about eating - 'Have you eaten today? What did you have?' — record EVERYTHING they mention they ate
5. Ask if they have any concerns or need anything - 'Is there anything else on your mind or anything you need help with?'

Be natural and conversational - these are NOT rapid-fire questions. Listen to each answer, respond with empathy, follow up on anything concerning. If they mention pain, ask where and how bad (1-10). If they have not eaten, gently encourage them. If they missed medications, remind them which ones.

CRITICAL — WHEN TO SEND CONCERN ALERTS:
Do NOT send concern alerts in the MIDDLE of the conversation. Complete ALL 5 check-in steps first. Gather all information. ONLY after the conversation is wrapping up and you have the full picture, THEN send ONE concern alert with a complete summary of everything discussed.

IMPORTANT: Family members receive a daily digest at their preferred time — NOT real-time notifications. So do NOT tell the client "I'm alerting your family right now." Instead say something natural like "I've noted everything and your family will be kept informed." The only exception is HIGH risk concerns which notify family immediately.

The concern alert summary must include EVERYTHING discussed during the call — nothing left out:
- How they are feeling (mood, energy, any complaints)
- Pain details (location, severity, what helps, new or ongoing)
- Medications (taken or missed, which ones, any side effects mentioned)
- Food and drinks (list everything they said they ate or drank)
- Sleep (how they slept, any issues)
- Activities (what they did, plans for the day)
- Concerns or requests they mentioned
- Anything else they talked about — even small things matter to family
Write it as a natural summary, not a bullet list. Family should feel like they were on the call.

After sending the summary alert and covering all topics, end warmly: 'It was wonderful talking with you. Have a wonderful day!'

IMPORTANT: Regular pain (ankle, back, hip, headache) is NOT an emergency. Ask follow-up questions, suggest contacting their doctor, offer to connect them. Use sendConcernAlert to notify family with a COMPLETE summary after the check-in. Only trigger sendEmergencyAlert for TRUE emergencies: falls where they can't get up, chest pain, breathing difficulty, stroke symptoms, or if they explicitly ask for help/911.`);
        firstMessage = `Good ${greeting}, ${patient.firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`;
        console.log(`[vapi-lookup] Check-in call for: ${patient.firstName} ${patient.lastName} (${digits})`);
      } else if (callType === 'medication') {
        // Routine reminder call
        prompt = buildLilySystemPrompt(context);
        firstMessage = `Hi ${patient.firstName || 'there'}! This is Lily from KinCare360. This is your routine reminder from your family. Please follow the instructions your family or care team gave you. Have you reviewed it?`;
        console.log(`[vapi-lookup] Routine reminder for: ${patient.firstName} ${patient.lastName} (${digits})`);
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

    // Provider callback handling removed: KinCare360 no longer schedules, cancels,
    // requests refills/tests, or communicates with providers as a medical representative.

    // Unknown caller - new prospect
    const context = `UNKNOWN CALLER - This person is NOT a client.

STRICT RULES:
- Start by listening to why they called. Do NOT interrogate them.
- Do NOT ask personal medical questions about their loved ones.
- If helpful, ask one gentle question: "Are you calling for yourself or for a loved one?"
- Explain KinCare360 with practical examples: daily phone check-ins, family-approved routine reminders, everyday coordination, local-service connection support, family updates, and no smartphone/app/computer required.
- Do NOT mention pricing unless they ask about cost, plans, trial, or how to get started.
- Do NOT mention the Partner Program unless they ask about referrals/partners, say someone referred them, or they are a professional/agency/community partner asking how to collaborate.
- If asked about pricing: Individual is ninety-nine dollars a month for one parent; Family is one hundred forty-nine dollars a month for two parents; free seven-day trial; cancel anytime.
- If asked about partnering: call it the Partner Program and direct them to kincare360.com/partners.
- Be warm, helpful, clear, and conservative. Never imply fall detection, emergency monitoring, medical supervision, medication compliance, or guaranteed safety.`;
    const prompt = buildLilySystemPrompt(context);
    const firstMessage = `Good ${greeting}, thank you for calling KinCare360! I'm Lily. How can I help you today?`;
    console.log(`[vapi-lookup] Unknown caller: ${digits}`);
    return NextResponse.json(buildAssistantConfig(prompt, firstMessage));
  } catch (error) {
    console.error("[vapi-lookup] Error:", error);
    // Fallback - return default assistant so call still connects
    const { greeting } = getTimeContext();
    const prompt = buildLilySystemPrompt(
      "System error during lookup. Treat caller warmly as a new prospective client. Explain KinCare360 clearly with examples if asked. Do not mention pricing unless asked. Do not mention the Partner Program unless relevant."
    );
    return NextResponse.json(
      buildAssistantConfig(
        prompt,
        `Good ${greeting}, thank you for calling KinCare360! I'm Lily. How can I help you today?`
      )
    );
  }
}
