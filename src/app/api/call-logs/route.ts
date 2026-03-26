import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;
const alertPhone = process.env.ALERT_PHONE_NUMBER!;

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: twilioPhone, Body: body });

  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch (e) {
    console.error('SMS send error:', e);
  }
}

// POST: VAPI webhook posts call summaries here + handles emergency escalation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract structured data from VAPI end-of-call report
    const analysis = body.message?.analysis || body.analysis || {};
    const structuredData = analysis.structuredData || {};
    const summary = analysis.summary || body.summary || '';
    const callId = body.message?.call?.id || body.callId || '';
    const customerPhone = body.message?.call?.customer?.number || body.customerPhone || '';
    const transcript = body.message?.transcript || body.transcript || null;
    const callType = body.message?.call?.type || body.callType || structuredData.callType || null;

    const urgent = structuredData.urgent === true ||
                   summary.toLowerCase().includes('urgent') ||
                   summary.toLowerCase().includes('911') ||
                   summary.toLowerCase().includes('chest pain') ||
                   summary.toLowerCase().includes('fall') ||
                   summary.toLowerCase().includes('breathing');

    // Find patient by phone
    const digits = customerPhone.replace(/\D/g, '').slice(-10);
    let patient = null;
    if (digits) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: digits } },
        include: { familyMembers: true },
      });
    }

    // Save call log
    if (patient) {
      await prisma.callLog.create({
        data: {
          patientId: patient.id,
          callDate: new Date(),
          summary: summary,
          mood: structuredData.mood || structuredData.feeling || null,
          medicationsTaken: structuredData.medications_taken === true,
          concerns: structuredData.concerns || null,
          urgent: urgent,
          transcript: transcript,
          callType: callType,
        },
      });
    }

    // EMERGENCY ESCALATION: If urgent, SMS all family members + Andrea
    if (urgent && patient) {
      const patientName = `${patient.firstName} ${patient.lastName}`;
      const urgentMsg = `⚠️ URGENT — KinCare360 Alert\n\n${patientName} reported a possible emergency during their daily check-in.\n\nDetails: ${summary}\n\nPlease check on them immediately or call 911 if needed.\n\n— KinCare360 Automated Alert`;

      // SMS all family members with notifications enabled
      for (const member of patient.familyMembers) {
        if (member.notifyUpdates && member.phone) {
          const memberDigits = member.phone.replace(/\D/g, '');
          if (memberDigits.length >= 10) {
            await sendSMS(`+1${memberDigits.slice(-10)}`, urgentMsg);
          }
        }
      }

      // Always alert Andrea
      await sendSMS(`+1${alertPhone.replace(/\D/g, '').slice(-10)}`, urgentMsg);
    }

    return NextResponse.json({ success: true, urgent, patientFound: !!patient });
  } catch (err) {
    console.error('Call log error:', err);
    return NextResponse.json({ success: false, error: 'Failed to process call log' }, { status: 500 });
  }
}

// GET: Fetch call logs for dashboard (supports patientId param or session-based lookup)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let patientId = searchParams.get('patientId');

  // If no patientId provided, look up from session
  if (!patientId) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const patient = await prisma.patient.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json([]);
    }
    patientId = patient.id;
  }

  const logs = await prisma.callLog.findMany({
    where: { patientId },
    orderBy: { callDate: 'desc' },
    take: 50,
  });

  return NextResponse.json(logs);
}
