import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

function digits(value: string) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

async function parseInboundMessage(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await req.json();
    const data = payload.data?.payload || payload.payload || payload;
    return {
      from: digits(data.from?.phone_number || data.from || data.From || ""),
      body: String(data.text || data.body || data.Body || "").trim().toUpperCase(),
    };
  }

  const form = await req.formData();
  return {
    from: digits(String(form.get("From") || form.get("from") || "")),
    body: String(form.get("Body") || form.get("body") || "").trim().toUpperCase(),
  };
}

async function acknowledge(from: string, message: string) {
  if (from) {
    await sendSMS(`+1${from}`, message);
  }
  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  const { from, body } = await parseInboundMessage(req);

  if (!from) {
    return NextResponse.json({ received: true, error: "missing_from" });
  }

  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(body)) {
    const members = await prisma.familyMember.findMany();
    const matching = members.filter((m) => digits(m.phone || "") === from);
    for (const member of matching) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: { smsConsentStatus: "opted_out", smsOptedOutAt: new Date(), alertsEnabled: false },
      });
    }
    return acknowledge(from, "You have been unsubscribed from KinCare360 text updates. No more messages will be sent. Reply START to resubscribe or visit kincare360.com/family-consent.");
  }

  if (["START", "YES", "UNSTOP"].includes(body)) {
    return acknowledge(from, "KinCare360: To receive recurring family text updates, please confirm consent at https://www.kincare360.com/family-consent. Msg & data rates may apply. Reply STOP to opt out.");
  }

  if (["HELP", "INFO"].includes(body)) {
    return acknowledge(from, "KinCare360 family updates. Help: hello@kincare360.com or (812) 515-5252. Terms: kincare360.com/terms Privacy: kincare360.com/privacy Reply STOP to opt out.");
  }

  return acknowledge(from, "KinCare360: Message received. For help, reply HELP. To opt out, reply STOP.");
}
