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

  // Get primary insurance if provided
  const primaryInsurance = Array.isArray(data.insurances) && data.insurances.length > 0 ? data.insurances[0] : null;

  const patient = await prisma.patient.create({
    data: {
      userId: user.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      dob: data.dob || null,
      phone: data.phone || null,
      gender: data.gender || null,
      preferredLanguage: data.preferredLanguage || "English",
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      preferredCallTime: data.checkInTime || null,
      medicationReminderTime: Array.isArray(data.medicationReminders)
        ? data.medicationReminders.map((r: any) => r.time).filter(Boolean).join(",")
        : null,
      checkInDays: Array.isArray(data.checkInDays) ? data.checkInDays.join(",") : null,
      insuranceCompany: primaryInsurance?.company || null,
      insuranceMemberId: primaryInsurance?.memberId || null,
      insuranceGroupNumber: primaryInsurance?.groupNumber || null,
      insurancePolicyHolder: primaryInsurance?.policyHolder || null,
    },
  });

  // Create doctors
  if (Array.isArray(data.doctors)) {
    for (const doc of data.doctors) {
      if (doc.name) {
        await prisma.doctor.create({
          data: {
            patientId: patient.id,
            name: doc.name,
            specialty: doc.specialty || null,
            phone: doc.phone || null,
            address: doc.address || null,
          },
        });
      }
    }
  }

  // Create pharmacies
  if (Array.isArray(data.pharmacies)) {
    for (const ph of data.pharmacies) {
      if (ph.name) {
        await prisma.pharmacy.create({
          data: {
            patientId: patient.id,
            name: ph.name,
            phone: ph.phone || null,
            address: ph.address || null,
          },
        });
      }
    }
  }

  // Create medications
  if (Array.isArray(data.medications)) {
    for (const med of data.medications) {
      if (med.name) {
        await prisma.medication.create({
          data: {
            patientId: patient.id,
            name: med.name,
            dosage: med.dosage || null,
            frequency: med.frequency || null,
          },
        });
      }
    }
  }

  // Create conditions
  if (Array.isArray(data.conditions)) {
    for (const cond of data.conditions) {
      if (cond.name) {
        await prisma.condition.create({
          data: { patientId: patient.id, name: cond.name },
        });
      }
    }
  }

  // Create family members
  if (Array.isArray(data.familyMembers)) {
    for (const fm of data.familyMembers) {
      if (fm.name) {
        await prisma.familyMember.create({
          data: {
            patientId: patient.id,
            name: fm.name,
            relationship: fm.relationship || null,
            phone: fm.phone || null,
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true, patientId: patient.id });
}
