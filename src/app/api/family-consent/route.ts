import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function digits(value: string) { return String(value || "").replace(/\D/g, "").slice(-10); }

export async function POST(req: NextRequest) {
  try {
    const { name, phone, lovedOne, relationship, consent } = await req.json();
    const phoneDigits = digits(phone);
    if (!name || !lovedOne || !relationship || phoneDigits.length !== 10 || consent !== true) {
      return NextResponse.json({ error: "Name, relationship, loved one, valid mobile number, and consent are required for SMS enrollment." }, { status: 400 });
    }

    const members = await prisma.familyMember.findMany({ include: { patient: { select: { firstName: true, lastName: true } } } });
    const loved = String(lovedOne).trim().toLowerCase();
    const member = members.find((m) => {
      const patientName = `${m.patient.firstName || ""} ${m.patient.lastName || ""}`.trim().toLowerCase();
      return digits(m.phone || "") === phoneDigits && (patientName.includes(loved) || loved.includes(m.patient.firstName.toLowerCase()) || loved.includes(patientName));
    }) || members.find((m) => digits(m.phone || "") === phoneDigits);

    if (!member) {
      return NextResponse.json({ error: "We could not find this mobile number in an active KinCare360 family profile. Ask the account owner to add you first, then submit this form again." }, { status: 404 });
    }

    await prisma.familyMember.update({
      where: { id: member.id },
      data: {
        name: name || member.name,
        relationship: relationship || member.relationship,
        smsConsentStatus: "opted_in",
        smsConsentSource: "family_web_form",
        smsConsentedAt: new Date(),
        smsOptedOutAt: null,
        alertMode: member.alertMode === "email" ? "both" : member.alertMode,
        alertsEnabled: true,
        notifyUpdates: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[family-consent] Error:", error);
    return NextResponse.json({ error: "Consent could not be recorded." }, { status: 500 });
  }
}
