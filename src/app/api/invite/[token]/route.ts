import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const user = await prisma.user.findFirst({
    where: {
      inviteToken: token,
      inviteExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return Response.json({ valid: false, reason: "This invitation has expired or is invalid." });
  }

  // Get the patient name
  let patientFirstName = "";
  if (user.patientId) {
    const patient = await prisma.patient.findUnique({ where: { id: user.patientId }, select: { firstName: true } });
    patientFirstName = patient?.firstName || "";
  }

  return Response.json({
    valid: true,
    name: user.name,
    patientFirstName,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { password } = body;

  if (!password || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      inviteToken: token,
      inviteExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return Response.json({ error: "This invitation has expired or is invalid." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user: set password, clear invite token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      inviteToken: null,
      inviteExpiry: null,
    },
  });

  // Link FamilyMember to this user (by email match)
  if (user.email) {
    const familyMember = await prisma.familyMember.findFirst({
      where: { email: user.email },
    });
    if (familyMember && !familyMember.userId) {
      await prisma.familyMember.update({
        where: { id: familyMember.id },
        data: { userId: user.id },
      });
    }
  }

  return Response.json({ success: true });
}
