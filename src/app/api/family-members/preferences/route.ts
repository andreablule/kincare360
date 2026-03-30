import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, alertMode, summaryTime, alertsEnabled } = body;

    if (!id) return NextResponse.json({ error: "Family member ID required" }, { status: 400 });

    const updateData: any = {};
    if (alertMode !== undefined) updateData.alertMode = alertMode;
    if (summaryTime !== undefined) updateData.summaryTime = summaryTime;
    if (alertsEnabled !== undefined) updateData.alertsEnabled = alertsEnabled;

    const updated = await prisma.familyMember.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, alertMode: true, summaryTime: true, alertsEnabled: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[family-preferences] Error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
