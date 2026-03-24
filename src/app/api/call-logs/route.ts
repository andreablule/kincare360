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

  const items = await prisma.callLog.findMany({
    where: { patientId },
    orderBy: { callDate: "desc" },
  });
  return Response.json({ items });
}

// POST is used by VAPI webhook to create call logs
export async function POST(req: NextRequest) {
  const body = await req.json();

  // If patientId is provided directly (VAPI webhook)
  if (body.patientId) {
    const item = await prisma.callLog.create({
      data: {
        patientId: body.patientId,
        callDate: body.callDate ? new Date(body.callDate) : new Date(),
        summary: body.summary,
        mood: body.mood,
        medicationsTaken: body.medicationsTaken ?? false,
        concerns: body.concerns,
        urgent: body.urgent ?? false,
      },
    });
    return Response.json({ item });
  }

  // Otherwise require auth (client creating a log)
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getPatientId((session.user as any).id);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const item = await prisma.callLog.create({
    data: {
      patientId,
      callDate: body.callDate ? new Date(body.callDate) : new Date(),
      summary: body.summary,
      mood: body.mood,
      medicationsTaken: body.medicationsTaken ?? false,
      concerns: body.concerns,
      urgent: body.urgent ?? false,
    },
  });
  return Response.json({ item });
}
