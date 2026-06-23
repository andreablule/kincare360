import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Provider scheduling is not offered by KinCare360.",
      message:
        "KinCare360 can support routine reminders and family follow-up notes, but families must contact providers directly for scheduling, cancellation, prescriptions, tests, referrals, and medical questions.",
    },
    { status: 410 }
  );
}
