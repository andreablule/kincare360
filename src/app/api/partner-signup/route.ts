import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hello@kincare360.com",
    pass: process.env.GOOGLE_SMTP_PASSWORD || "rogv owro cfhd sasp",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await transporter.sendMail({
      from: "KinCare360 <hello@kincare360.com>",
      to: "hello@kincare360.com",
      subject: `New Referral Partner Signup: ${name}`,
      html: `
        <h2>New Referral Partner Signup</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p>Submitted at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Partner signup email error:", err);
    return NextResponse.json({ error: "Failed to process signup" }, { status: 500 });
  }
}
