import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function digits(value: string) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function twiml(message: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = digits(String(form.get("From") || ""));
  const body = String(form.get("Body") || "").trim().toUpperCase();

  if (!from) return twiml("KinCare360: We could not identify your phone number. For help, contact hello@kincare360.com or (812) 515-5252.");

  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(body)) {
    const members = await prisma.familyMember.findMany();
    const matching = members.filter((m) => digits(m.phone || "") === from);
    for (const member of matching) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: { smsConsentStatus: "opted_out", smsOptedOutAt: new Date(), alertsEnabled: false },
      });
    }
    return twiml("You have been unsubscribed from KinCare360 text updates. No more messages will be sent. Reply START to resubscribe or visit kincare360.com/family-consent.");
  }

  if (["START", "YES", "UNSTOP"].includes(body)) {
    return twiml("KinCare360: To receive recurring family care text updates, please confirm consent at https://www.kincare360.com/family-consent. Msg & data rates may apply. Reply STOP to opt out.");
  }

  if (["HELP", "INFO"].includes(body)) {
    return twiml("KinCare360 family care updates. Help: hello@kincare360.com or (812) 515-5252. Terms: kincare360.com/terms Privacy: kincare360.com/privacy Reply STOP to opt out.");
  }

  return twiml("KinCare360: Message received. For help, reply HELP. To opt out, reply STOP.");
}
