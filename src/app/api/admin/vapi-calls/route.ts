import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "VAPI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.vapi.ai/call?limit=20", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "VAPI API error" }, { status: res.status });
    }

    const data = await res.json();
    const calls = (Array.isArray(data) ? data : data.data || data.calls || []);

    const formatted = calls.map((call: any) => {
      const messages = call.messages || call.artifact?.messages || [];
      const transcript = messages
        .filter((m: any) => m.role === "assistant" || m.role === "user")
        .map((m: any) => ({ role: m.role, content: m.message || m.content || "" }));

      return {
        id: call.id,
        createdAt: call.createdAt,
        type: call.type || "unknown",
        status: call.status,
        duration: call.duration ?? call.costBreakdown?.duration ?? null,
        customerNumber: call.customer?.number || null,
        endedReason: call.endedReason || null,
        cost: call.cost ?? call.costBreakdown?.total ?? null,
        transcript,
      };
    });

    formatted.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(formatted);
  } catch (e: any) {
    console.error("VAPI fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}
