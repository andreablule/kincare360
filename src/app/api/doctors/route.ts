import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId, canEdit, resolvePatientIdFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requestedId = req.nextUrl.searchParams.get("patientId");
  const patientId = await resolvePatientIdFromRequest(user, requestedId);
  if (!patientId) return Response.json({ items: [] });

  const items = await prisma.doctor.findMany({ where: { patientId } });
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(user.role)) return Response.json({ error: "Read-only access" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const body = await req.json();
  const item = await prisma.doctor.create({
    data: { patientId, name: body.name, specialty: body.specialty, phone: body.phone, address: body.address, notes: body.notes },
  });
  return Response.json({ item });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(user.role)) return Response.json({ error: "Read-only access" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const item = await prisma.doctor.update({
    where: { id },
    data: { name: body.name, specialty: body.specialty, phone: body.phone, address: body.address, notes: body.notes },
  });
  return Response.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(user.role)) return Response.json({ error: "Read-only access" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.doctor.delete({ where: { id } });
  return Response.json({ ok: true });
}
