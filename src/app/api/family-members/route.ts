import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPatientId(userId: string) {
  const patient = await prisma.patient.findFirst({ where: { userId } });
  return patient?.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getPatientId((session.user as any).id);
  if (!patientId) return Response.json({ items: [] });

  const items = await prisma.familyMember.findMany({ where: { patientId } });
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getPatientId((session.user as any).id);
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
    },
  });
  return Response.json({ item });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getPatientId((session.user as any).id);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.familyMember.findUnique({ where: { id } });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const item = await prisma.familyMember.update({
    where: { id },
    data: {
      name: body.name,
      relationship: body.relationship,
      phone: body.phone,
      email: body.email,
      notifyUpdates: body.notifyUpdates ?? true,
    },
  });
  return Response.json({ item });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getPatientId((session.user as any).id);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.familyMember.findUnique({ where: { id } });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.familyMember.delete({ where: { id } });
  return Response.json({ ok: true });
}
