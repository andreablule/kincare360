import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getSessionPatientId } from '@/lib/session';
import prisma from '@/lib/prisma';

import { sendSMS } from '@/lib/sms';

const alertPhone = process.env.ALERT_PHONE_NUMBER!;

// POST: VAPI webhook posts call summaries here + handles emergency escalation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ONLY process end-of-call-report events — ignore all other VAPI events
    const messageType = body.message?.type || body.type || '';
    if (messageType && messageType !== 'end-of-call-report') {
      return NextResponse.json({ received: true, skipped: messageType });
    }

    // Extract structured data from VAPI end-of-call report
    const analysis = body.message?.analysis || body.analysis || {};
    const structuredData = analysis.structuredData || {};
    const summary = analysis.summary || body.summary || '';
    const callId = body.message?.call?.id || body.callId || '';
    const customerPhone = body.message?.call?.customer?.number || body.customerPhone || '';
    const transcript = body.message?.transcript || body.transcript || null;
    const callType = body.message?.call?.type || body.callType || structuredData.callType || null;

    // Service concierge activity — capture what services Lily searched/called
    let servicesRequested: string | null = null;
    if (structuredData.service_requested || structuredData.providers_contacted) {
      const serviceData = {
        service: structuredData.service_requested || null,
        providers: structuredData.providers_contacted || [],
        outcome: structuredData.outcome || null,
      };
      servicesRequested = JSON.stringify(serviceData);
    }

    const lowerSummary = summary.toLowerCase();
    const lowerTranscript = (transcript || '').toLowerCase();
    const fullText = lowerSummary + ' ' + lowerTranscript;
    const urgent = structuredData.urgent === true ||
                   fullText.includes('call 911') ||
                   fullText.includes('called 911') ||
                   fullText.includes('chest pain') ||
                   fullText.includes('can\'t breathe') ||
                   fullText.includes('difficulty breathing') ||
                   fullText.includes('fell down') ||
                   fullText.includes('had a fall') ||
                   fullText.includes('stroke') ||
                   fullText.includes('unconscious') ||
                   fullText.includes('not responding') ||
                   fullText.includes('emergency');

    // Find patient by phone
    const digits = customerPhone.replace(/\D/g, '').slice(-10);
    let patient = null;
    if (digits) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: digits } },
        include: { familyMembers: true },
      });
    }

    // Save call log — deduplicate by callId if provided
    if (patient) {
      const existingLog = callId
        ? await prisma.callLog.findFirst({ where: { transcript: { contains: callId } } })
        : null;

      if (!existingLog) {
        await prisma.callLog.create({
          data: {
            patientId: patient.id,
            callDate: new Date(),
            summary: summary,
            mood: structuredData.mood || structuredData.feeling || null,
            medicationsTaken: structuredData.medications_taken === true,
            concerns: structuredData.concerns || null,
            urgent: urgent,
            transcript: transcript ? `[callId:${callId}]\n${transcript}` : `[callId:${callId}]`,
            callType: callType,
            servicesRequested: servicesRequested,
          },
        });
      }
    } else if (digits) {
      // No matching patient — upsert into Prospect to track unknown callers
      const existingProspect = await prisma.prospect.findFirst({ where: { phone: { contains: digits } } });
      if (existingProspect) {
        await prisma.prospect.update({
          where: { id: existingProspect.id },
          data: {
            callCount: { increment: 1 },
            lastCallAt: new Date(),
            ...(summary ? { summary } : {}),
            ...(structuredData.mood || structuredData.feeling ? { mood: structuredData.mood || structuredData.feeling } : {}),
            ...(structuredData.concerns ? { concerns: structuredData.concerns } : {}),
          },
        });
      } else {
        await prisma.prospect.create({
          data: {
            phone: customerPhone || digits,
            lastCallAt: new Date(),
            summary: summary || null,
            mood: structuredData.mood || structuredData.feeling || null,
            concerns: structuredData.concerns || null,
            status: 'NEW',
          },
        });
      }
    }

    // CHECK-IN SMS: If this is a check-in call, notify family members with updates enabled
    if (!urgent && patient && (callType === 'check-in' || callType?.toLowerCase().includes('check'))) {
      const moodText = structuredData.mood || structuredData.feeling || 'not recorded';
      const medsText = structuredData.medications_taken === true ? 'Yes ✓' : 'No ✗';
      const checkInMsg = `KinCare360 Update: ${patient.firstName} ${patient.lastName}'s check-in with Lily is complete.\nMood: ${moodText}. Medications taken: ${medsText}.\nView full report: kincare360.com/dashboard`;

      for (const member of patient.familyMembers) {
        if (member.notifyUpdates && member.alertsEnabled && member.smsConsentStatus === 'opted_in' && ['text', 'both'].includes(member.alertMode) && member.phone) {
          const memberDigits = member.phone.replace(/\D/g, '');
          if (memberDigits.length >= 10) {
            await sendSMS(`+1${memberDigits.slice(-10)}`, checkInMsg);
          }
        }
      }
    }

    // EMERGENCY ESCALATION: If urgent, SMS all family members + Andrea
    if (urgent && patient) {
      const patientName = `${patient.firstName} ${patient.lastName}`;
      const urgentMsg = `KinCare360 family follow-up\n\n${patientName} shared a concern during their Lily check-in.\n\nDetails: ${summary}\n\nPlease check the family dashboard or follow up when available. KinCare360 is not an emergency or medical service. If there is immediate danger, call 911.\n\n— KinCare360 Family Notice`;

      // Also send check-in summary with family follow-up flag to family
      const urgentCheckInMsg = `KinCare360 Update: ${patientName}'s check-in with Lily is complete.\nFamily follow-up requested — please review the dashboard when available.\nView full report: kincare360.com/dashboard`;

      // SMS all family members with notifications enabled
      for (const member of patient.familyMembers) {
        if (member.notifyUpdates && member.alertsEnabled && member.smsConsentStatus === 'opted_in' && ['text', 'both'].includes(member.alertMode) && member.phone) {
          const memberDigits = member.phone.replace(/\D/g, '');
          if (memberDigits.length >= 10) {
            // Send both the summary and the full urgent alert
            await sendSMS(`+1${memberDigits.slice(-10)}`, urgentCheckInMsg);
            await sendSMS(`+1${memberDigits.slice(-10)}`, urgentMsg);
          }
        }
      }

      // Always alert Andrea
      await sendSMS(`+1${alertPhone.replace(/\D/g, '').slice(-10)}`, urgentMsg);
    }

    // OUTBOUND SCHEDULING CALLBACK: If this was an outbound call, check if it matches a pending appointment
    // and trigger a callback to the patient with the results
    if (callId && callType === 'outboundPhoneCall') {
      try {
        const pendingAppt = await prisma.serviceRequest.findFirst({
          where: {
            status: "IN_PROGRESS",
            type: "APPOINTMENT",
            description: { contains: callId },
          },
          include: { patient: true },
        });

        if (pendingAppt && pendingAppt.patient) {
          const pt = pendingAppt.patient;
          // Extract callback phone from description
          const cbMatch = pendingAppt.description?.match(/CALLBACK: (\d+)/);
          const cbPhone = cbMatch?.[1] || pt.phone;
          const providerMatch = pendingAppt.description?.match(/DOCTOR: (.+)/);
          const providerLabel = providerMatch?.[1] || "the doctor's office";

          if (cbPhone) {
            const cbDigits = cbPhone.replace(/\D/g, "").slice(-10);
            
            // Check transcript carefully for ACTUAL confirmed appointment
            const fullText = ((transcript || "") + " " + summary).toLowerCase();
            const hasConfirmedDate = fullText.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*\b(am|pm|\d{1,2}:\d{2})\b/);
            const officeConfirmed = hasConfirmedDate && (fullText.includes("see you") || fullText.includes("we'll see") || fullText.includes("you're all set") || fullText.includes("appointment is") || fullText.includes("booked"));
            const askedToCallBack = fullText.includes("call back") || fullText.includes("check with") || fullText.includes("call us back") || fullText.includes("no availability");
            const noAnswer = fullText.length < 50; // Very short = no real conversation

            let callbackPrompt: string;
            let firstMsg: string;

            if (officeConfirmed) {
              // Mark appointment as DONE in DB
              await prisma.serviceRequest.update({ where: { id: pendingAppt.id }, data: { status: "DONE" } });
              console.log(`[call-logs] Appointment ${pendingAppt.id} marked as DONE`);
              
              callbackPrompt = `You are Lily from KinCare360, calling ${pt.firstName} back. You SUCCESSFULLY scheduled their appointment with ${providerLabel}. Here is exactly what happened:\n\n${summary}\n\nTell ${pt.firstName} the EXACT date, time, and doctor confirmed by the office. Only share details that were actually confirmed. Ask if they need anything else.`;
              firstMsg = `Hi ${pt.firstName}, this is Lily from KinCare360. Great news — I was able to schedule your appointment with ${providerLabel}!`;
            } else if (askedToCallBack) {
              callbackPrompt = `You are Lily from KinCare360, calling ${pt.firstName} back about ${providerLabel}. The office didn't have availability for the requested time and asked you to check with your client about alternative dates. Here's what happened:\n\n${summary}\n\nLet ${pt.firstName} know honestly that the office needs them to pick a different date. Ask when else works for them, and offer to call the office again.`;
              firstMsg = `Hi ${pt.firstName}, this is Lily from KinCare360. I called ${providerLabel} but they didn't have availability for the time you requested. Let me tell you what they said.`;
            } else if (noAnswer) {
              callbackPrompt = `You are Lily from KinCare360, calling ${pt.firstName} back. You tried calling ${providerLabel} but no one answered. Let them know you'll try again during business hours, or they can call the office directly. Be warm.`;
              firstMsg = `Hi ${pt.firstName}, this is Lily from KinCare360. I tried reaching ${providerLabel} but wasn't able to get through. It may be outside their office hours.`;
            } else {
              callbackPrompt = `You are Lily from KinCare360, calling ${pt.firstName} back about ${providerLabel}. You spoke with the office but the appointment was NOT fully confirmed. Here's what happened:\n\n${summary}\n\nBe HONEST — only share what was actually confirmed. If no date/time was confirmed, tell ${pt.firstName} the appointment is not yet scheduled and offer to try again.`;
              firstMsg = `Hi ${pt.firstName}, this is Lily from KinCare360 calling you back about ${providerLabel}.`;
            }

            const vapiApiKey = process.env.VAPI_API_KEY;
            const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

            if (!vapiApiKey || !vapiPhoneNumberId) {
              console.warn("[call-logs] Callback trigger skipped; missing VAPI_API_KEY or VAPI_PHONE_NUMBER_ID.");
            } else {
              await fetch("https://api.vapi.ai/call/phone", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${vapiApiKey}`,
              },
              body: JSON.stringify({
                phoneNumberId: vapiPhoneNumberId,
                customer: { number: `+1${cbDigits}` },
                assistant: {
                  name: "Lily - Callback",
                  model: {
                    provider: "openai",
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: callbackPrompt }],
                  },
                  voice: { provider: "11labs", voiceId: "paula" },
                  firstMessage: firstMsg,
                  serverUrl: "https://www.kincare360.com/api/call-logs",
                  backgroundSound: "off",
                  backgroundDenoisingEnabled: true,
                  backchannelingEnabled: false,
                  endCallPhrases: ["have a wonderful day", "have a great day", "goodbye", "bye", "take care"],
                },
              }),
            });
            console.log(`[call-logs] Triggered callback to ${pt.firstName} at ${cbDigits} | confirmed: ${!!officeConfirmed}`);
            }
          }
        }
      } catch (cbErr) {
        console.error("[call-logs] Callback trigger error:", cbErr);
      }
    }

    return NextResponse.json({ success: true, urgent, patientFound: !!patient });
  } catch (err) {
    console.error('Call log error:', err);
    return NextResponse.json({ success: false, error: 'Failed to process call log' }, { status: 500 });
  }
}

// GET: Fetch call logs for dashboard (supports patientId param or session-based lookup)
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { resolvePatientIdFromRequest } = await import('@/lib/session');
  const requestedId = new URL(req.url).searchParams.get('patientId');
  const patientId = await resolvePatientIdFromRequest(user, requestedId);
  if (!patientId) {
    return NextResponse.json([]);
  }

  const logs = await prisma.callLog.findMany({
    where: { patientId },
    orderBy: { callDate: 'desc' },
    take: 50,
  });

  return NextResponse.json(logs);
}
