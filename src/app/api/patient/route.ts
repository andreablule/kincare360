import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPatient(userId: string) {
  return prisma.patient.findFirst({ where: { userId } });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const patient = await getPatient(userId);
  return Response.json({ patient });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const patient = await getPatient(userId);

  const data = {
    firstName: body.firstName,
    lastName: body.lastName,
    dob: body.dob,
    phone: body.phone,
    address: body.address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    preferredCallTime: body.preferredCallTime,
    medicationReminderTime: body.medicationReminderTime,
    checkInDays: body.checkInDays,
    preferredLanguage: body.preferredLanguage,
  };

  if (patient) {
    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data,
    });
    return Response.json({ patient: updated });
  } else {
    const created = await prisma.patient.create({
      data: { ...data, userId, firstName: data.firstName || "", lastName: data.lastName || "" },
    });
    return Response.json({ patient: created });
  }
}
