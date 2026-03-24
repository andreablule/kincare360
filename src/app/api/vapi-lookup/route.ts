import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// VAPI calls this webhook when a call comes in
// It sends the caller's phone number, and we return patient context
// so Lily can greet them by name and know their full profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // VAPI sends phone number in different formats depending on the event
    const callerPhone = body.call?.customer?.number || body.phoneNumber || body.from || "";
    
    if (!callerPhone) {
      return NextResponse.json({ message: "No phone number provided" }, { status: 200 });
    }

    // Normalize phone: strip everything except digits, keep last 10
    const digits = callerPhone.replace(/\D/g, "").slice(-10);

    // Find patient by phone number
    const patient = await prisma.patient.findFirst({
      where: {
        phone: { contains: digits },
      },
      include: {
        doctors: true,
        pharmacies: true,
        medications: true,
        conditions: true,
        familyMembers: true,
        callLogs: {
          orderBy: { callDate: "desc" },
          take: 3,
        },
        user: {
          select: { plan: true, subscriptionStatus: true },
        },
      },
    });

    if (!patient) {
      // Unknown caller — Lily treats them as a new prospect
      return NextResponse.json({
        known: false,
        context: "This is a new caller, not an existing client. Treat them as a prospective client — answer their questions about KinCare360, explain services and pricing, and offer to help them get started.",
      });
    }

    // Build Lily's context about this patient
    const medList = patient.medications.map(m => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`).join("; ") || "None recorded";
    const condList = patient.conditions.map(c => c.name).join(", ") || "None recorded";
    const docList = patient.doctors.map(d => `${d.name}${d.specialty ? ` (${d.specialty})` : ''}`).join("; ") || "None recorded";
    const pharmList = patient.pharmacies.map(p => p.name).join("; ") || "None recorded";
    const familyList = patient.familyMembers.map(f => `${f.name} (${f.relationship})`).join("; ") || "None recorded";
    
    const lastCall = patient.callLogs[0];
    const lastCallSummary = lastCall 
      ? `Last call was on ${new Date(lastCall.callDate).toLocaleDateString()}: ${lastCall.summary || 'No summary'}. Mood: ${lastCall.mood || 'unknown'}. Medications taken: ${lastCall.medicationsTaken ? 'yes' : 'no/unknown'}.`
      : "No previous calls recorded.";

    const context = `This is ${patient.firstName} ${patient.lastName}, an existing KinCare360 client on the ${patient.user?.plan || 'unknown'} plan.

Patient details:
- Name: ${patient.firstName} ${patient.lastName}
- Date of birth: ${patient.dob || 'unknown'}
- Location: ${patient.city || ''}, ${patient.state || ''}
- Preferred check-in time: ${patient.preferredCallTime || 'not set'}
- Medication reminder time: ${patient.medicationReminderTime || 'not set'}

Medications: ${medList}
Conditions: ${condList}
Doctors: ${docList}
Pharmacies: ${pharmList}
Family contacts: ${familyList}

${lastCallSummary}

Preferred language: ${patient.preferredLanguage || 'English'}

IMPORTANT: 
- Greet ${patient.firstName} by name warmly.
- Reference their specific medications and doctors when relevant. 
- This is a known client — give them VIP treatment.
- SPEAK IN ${(patient.preferredLanguage || 'English').split(' / ')[0].toUpperCase()} for the entire call. Start the conversation in their preferred language immediately. Do not start in English and switch — begin in their language from the first word.`;

    return NextResponse.json({
      known: true,
      patientId: patient.id,
      firstName: patient.firstName,
      context,
    });
  } catch (error) {
    console.error("VAPI lookup error:", error);
    return NextResponse.json({ known: false, context: "System error — treat caller as new." }, { status: 200 });
  }
}
