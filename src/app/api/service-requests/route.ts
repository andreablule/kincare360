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

  const items = await prisma.serviceRequest.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getPatientId((session.user as any).id);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const body = await req.json();
  const item = await prisma.serviceRequest.create({
    data: {
      patientId,
      type: body.type,
      description: body.description,
    },
  });
  return Response.json({ item });
}
