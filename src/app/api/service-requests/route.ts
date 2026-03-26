import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId, canEdit } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ items: [] });

  const items = await prisma.serviceRequest.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(user.role)) return Response.json({ error: "Read-only access" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const body = await req.json();
  const item = await prisma.serviceRequest.create({
    data: { patientId, type: body.type, description: body.description },
  });
  return Response.json({ item });
}
