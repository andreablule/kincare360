import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CallFeedClient from "./CallFeedClient";

export const dynamic = "force-dynamic";

async function fetchVapiCalls() {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.vapi.ai/call?limit=20", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const calls = Array.isArray(data) ? data : data.data || data.calls || [];

    return calls.map((call: any) => {
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
    }).sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    console.error("VAPI fetch error:", e);
    return [];
  }
}

async function getPatientMap() {
  const patients = await prisma.patient.findMany({
    select: { firstName: true, lastName: true, phone: true },
    where: { phone: { not: null } },
  });
  const map: Record<string, string> = {};
  for (const p of patients) {
    if (p.phone) {
      const digits = p.phone.replace(/\D/g, "").slice(-10);
      if (digits) map[digits] = `${p.firstName} ${p.lastName}`;
    }
  }
  return map;
}

export default async function AdminCallsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com" && user.email !== "andreablule@gmail.com")) {
    redirect("/admin");
  }

  const [calls, patientMap] = await Promise.all([fetchVapiCalls(), getPatientMap()]);

  const now = new Date();

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <header className="bg-[#0f172a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-white text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">KinCare360</Link>
            <span className="bg-teal/20 text-teal text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
            <span className="text-gray-500 text-sm">/</span>
            <span className="text-gray-300 text-sm font-medium">Call Logs</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-400 text-sm">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <Link href="/admin" className="text-sm text-teal hover:text-teal/80 transition-colors font-medium">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <CallFeedClient calls={calls} patientMap={patientMap} />
      </main>
    </div>
  );
}
