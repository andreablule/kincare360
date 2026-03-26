import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "hello@kincare360.com",
    pass: "rogvowrocfhdsasp",
  },
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as any;
  if (sessionUser.role !== "CLIENT") {
    return Response.json({ error: "Only account owners can invite family members" }, { status: 403 });
  }

  const body = await req.json();
  const { familyMemberId, name, email, phone, relationship } = body;

  if (!email) {
    return Response.json({ error: "Email is required to send an invitation" }, { status: 400 });
  }

  // Find patient for this owner
  const patient = await prisma.patient.findFirst({ where: { userId: sessionUser.id } });
  if (!patient) {
    return Response.json({ error: "No patient profile found" }, { status: 400 });
  }

  // Find or create FamilyMember record
  let familyMember;
  if (familyMemberId) {
    familyMember = await prisma.familyMember.findUnique({ where: { id: familyMemberId } });
    if (!familyMember || familyMember.patientId !== patient.id) {
      return Response.json({ error: "Family member not found" }, { status: 404 });
    }
    // Update email/phone/name if provided
    familyMember = await prisma.familyMember.update({
      where: { id: familyMemberId },
      data: { name: name || familyMember.name, email, phone: phone || familyMember.phone, relationship: relationship || familyMember.relationship },
    });
  } else {
    familyMember = await prisma.familyMember.create({
      data: { patientId: patient.id, name: name || "", email, phone: phone || "", relationship: relationship || "" },
    });
  }

  // Generate invite token
  const inviteToken = crypto.randomUUID();
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  // Upsert User record for the invitee
  const invitedUser = await prisma.user.upsert({
    where: { email },
    update: {
      inviteToken,
      inviteExpiry,
      role: "FAMILY",
      patientId: patient.id,
    },
    create: {
      email,
      password: "", // will be set when invite is accepted
      name: name || "",
      role: "FAMILY",
      inviteToken,
      inviteExpiry,
      patientId: patient.id,
    },
  });

  // Link FamilyMember to User (if not already)
  await prisma.familyMember.update({
    where: { id: familyMember.id },
    data: { userId: invitedUser.id },
  });

  // Send invitation email
  const inviterName = sessionUser.name || sessionUser.email;
  const patientName = `${patient.firstName} ${patient.lastName}`;
  const patientFirstName = patient.firstName;
  const acceptUrl = `https://kincare360.com/invite/${inviteToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You've been invited to KinCare360</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:40px 40px 32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">KinCare360</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your family's care, always connected.</p>
    </div>
    
    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px;">You've been invited! 💙</h2>
      
      <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px;">
        <strong>${inviterName}</strong> has given you access to stay updated on <strong>${patientName}'s</strong> daily care through KinCare360.
      </p>
      
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        KinCare360 is a personalized remote care service that keeps families connected. Our AI wellness assistant Lily checks in with ${patientFirstName} daily — tracking medications, mood, and health concerns — so you always know they're okay.
      </p>

      <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:20px;margin:0 0 28px;">
        <p style="color:#0f766e;font-size:14px;font-weight:600;margin:0 0 10px;">With your family dashboard, you can:</p>
        <ul style="color:#475569;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
          <li>View daily check-in summaries from Lily</li>
          <li>Get urgent alerts if something needs your attention</li>
          <li>See ${patientFirstName}'s medications, doctors &amp; care plan</li>
          <li>Update your contact info and notification preferences</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${acceptUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.2px;">
          Accept Invitation →
        </a>
      </div>

      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0 0 8px;">
        This invitation expires in 48 hours.
      </p>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
        If you can't click the button, copy this link: <br>
        <a href="${acceptUrl}" style="color:#0d9488;">${acceptUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
      <p style="color:#64748b;font-size:13px;margin:0;">KinCare360 &nbsp;|&nbsp; <a href="mailto:hello@kincare360.com" style="color:#0d9488;text-decoration:none;">hello@kincare360.com</a> &nbsp;|&nbsp; (812) 515-5252</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: '"KinCare360" <hello@kincare360.com>',
      to: email,
      subject: `You've been invited to KinCare360 — ${patientFirstName}'s care dashboard`,
      html,
    });
  } catch (err) {
    console.error("Email send error:", err);
    // Don't fail the request if email fails — token is still set
  }

  return Response.json({ ok: true, message: "Invitation sent successfully" });
}
