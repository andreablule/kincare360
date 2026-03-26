import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId, canEdit } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ patient: null });

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  return Response.json({ patient });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEdit(user.role)) return Response.json({ error: "Insufficient permissions" }, { status: 403 });

  const body = await req.json();
  const patientId = await getSessionPatientId(user);

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
    medicationReminderTime: body.medicationReminderTime ?? undefined,
    checkInDays: body.checkInDays ?? undefined,
    preferredLanguage: body.preferredLanguage ?? undefined,
    gender: body.gender ?? undefined,
  };

  if (patientId) {
    const updated = await prisma.patient.update({ where: { id: patientId }, data });
    return Response.json({ patient: updated });
  } else if (user.role === "CLIENT") {
    // Only CLIENT can create a new patient record
    const created = await prisma.patient.create({
      data: { ...data, userId: user.id, firstName: data.firstName || "", lastName: data.lastName || "" },
    });
    return Response.json({ patient: created });
  }
  return Response.json({ error: "No patient profile found" }, { status: 400 });
}
