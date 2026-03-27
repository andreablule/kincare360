import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { isFamilyPlan } from "@/lib/format-plan";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "CLIENT") return NextResponse.json({ error: "Only the account owner can add patients" }, { status: 403 });

  // Verify user has a family plan
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } });
  if (!isFamilyPlan(dbUser?.plan)) {
    return NextResponse.json({ error: "Family plan required to add a second parent" }, { status: 403 });
  }

  // Verify user doesn't already have 2 patients
  const existingCount = await prisma.patient.count({ where: { userId: user.id } });
  if (existingCount >= 2) {
    return NextResponse.json({ error: "You already have 2 patient profiles" }, { status: 400 });
  }

  const data = await req.json();

  const patient = await prisma.patient.create({
    data: {
      userId: user.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      dob: data.dob || null,
      phone: data.phone || null,
      gender: data.gender || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      preferredCallTime: data.checkInTime || null,
      medicationReminderTime: Array.isArray(data.medicationReminders)
        ? data.medicationReminders.map((r: any) => r.time).filter(Boolean).join(",")
        : null,
      checkInDays: Array.isArray(data.checkInDays) ? data.checkInDays.join(",") : null,
    },
  });

  // Create doctor if provided
  if (data.primaryDoctor) {
    await prisma.doctor.create({
      data: {
        patientId: patient.id,
        name: data.primaryDoctor,
        phone: data.doctorPhone || null,
      },
    });
  }

  // Create medications if provided
  if (data.medications) {
    const meds = data.medications.split(",").map((m: string) => m.trim()).filter(Boolean);
    for (const med of meds) {
      await prisma.medication.create({ data: { patientId: patient.id, name: med } });
    }
  }

  // Create conditions if provided
  if (data.conditions) {
    const conds = data.conditions.split(",").map((c: string) => c.trim()).filter(Boolean);
    for (const cond of conds) {
      await prisma.condition.create({ data: { patientId: patient.id, name: cond } });
    }
  }

  return NextResponse.json({ success: true, patientId: patient.id });
}
