import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId, canManageFamilyMembers, resolvePatientIdFromRequest } from "@/lib/session";

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;

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
    console.error('SMS error:', e);
  }
}

function generateCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requestedId = req.nextUrl.searchParams.get("patientId");
  const patientId = await resolvePatientIdFromRequest(user, requestedId);
  if (!patientId) return Response.json({ items: [] });

  const items = await prisma.familyMember.findMany({
    where: { patientId },
    include: {
      user: {
        select: { id: true, role: true, inviteToken: true, inviteExpiry: true },
      },
    },
  });

  // Compute invite status for each member
  const enriched = items.map((m) => {
    let inviteStatus: "none" | "pending" | "active" = "none";
    if (m.user) {
      if (m.user.inviteToken && m.user.inviteExpiry && new Date(m.user.inviteExpiry) > new Date()) {
        inviteStatus = "pending";
      } else if (!m.user.inviteToken) {
        inviteStatus = "active";
      } else {
        // Token expired but user exists — treat as pending (expired)
        inviteStatus = "pending";
      }
    }
    return {
      ...m,
      inviteStatus,
      linkedRole: m.user?.role ?? null,
    };
  });

  return Response.json({ items: enriched });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageFamilyMembers(user.role)) return Response.json({ error: "Insufficient permissions" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const body = await req.json();
  const item = await prisma.familyMember.create({
    data: {
      patientId,
      name: body.name,
      relationship: body.relationship,
      phone: body.phone,
      email: body.email,
      notifyUpdates: body.notifyUpdates ?? true,
      alertMode: body.alertMode ?? 'email',
      summaryTime: body.summaryTime ?? '18:00',
      alertsEnabled: body.alertsEnabled ?? true,
    },
  });

  // Auto-create a referral code for this family member
  try {
    let code = generateCode(body.name || "FAM");
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.referral.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode(body.name || "FAM");
      attempts++;
    }

    await prisma.referral.create({
      data: {
        code,
        type: "family",
        referrerName: body.name,
        referrerEmail: body.email || null,
        referrerPhone: body.phone || null,
        familyMemberId: item.id,
      },
    });

    // Send SMS to family member if they have a phone
    if (body.phone) {
      const digits = body.phone.replace(/\D/g, "").slice(-10);
      if (digits.length === 10) {
        await sendSMS(
          `+1${digits}`,
          `You're part of KinCare360's referral program! Share your code ${code} and earn $50 for every new subscription. Link: kincare360.com/register?ref=${code}`
        );
      }
    }
  } catch (err) {
    console.error("Family referral auto-create error:", err);
  }

  return Response.json({ item });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getSessionPatientId(user);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.familyMember.findUnique({ where: { id } });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  // FAMILY members can only update their own record
  if (user.role === "FAMILY") {
    const isOwnRecord = existing.userId === user.id;
    if (!isOwnRecord) return Response.json({ error: "You can only update your own profile" }, { status: 403 });
  }

  const body = await req.json();
  const item = await prisma.familyMember.update({
    where: { id },
    data: {
      name: body.name,
      relationship: body.relationship,
      phone: body.phone,
      email: body.email,
      notifyUpdates: body.notifyUpdates ?? true,
      alertMode: body.alertMode ?? undefined,
      summaryTime: body.summaryTime ?? undefined,
      alertsEnabled: body.alertsEnabled ?? undefined,
    },
  });
  return Response.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageFamilyMembers(user.role)) return Response.json({ error: "Insufficient permissions" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.familyMember.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  // If linked to a user account, delete that too
  if (existing.userId) {
    await prisma.familyMember.update({ where: { id }, data: { userId: null } });
    await prisma.user.delete({ where: { id: existing.userId } });
  }

  await prisma.familyMember.delete({ where: { id } });
  return Response.json({ ok: true });
}
