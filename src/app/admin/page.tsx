import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const PLAN_PRICES: Record<string, number> = { ESSENTIAL: 50, PLUS: 80, CONCIERGE: 110, ESSENTIAL_FAMILY: 75, PLUS_FAMILY: 130, CONCIERGE_FAMILY: 180, COMPLETE: 110, COMPLETE_FAMILY: 180 };

function relativeDate(date: Date) {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return diffDays + " days ago";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const typeIcons: Record<string, string> = {
  APPOINTMENT: "\u{1F4C5}",
  FOLLOWUP: "\u{1F504}",
  MEDICATION_CHANGE: "\u{1F48A}",
  OTHER: "\u{1F4CB}",
};

const typeLabels: Record<string, string> = {
  APPOINTMENT: "Appointment",
  FOLLOWUP: "Follow-up",
  MEDICATION_CHANGE: "Medication",
  OTHER: "Other",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com")) {
    redirect("/admin");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    activeUsers,
    trialingUsers,
    pastDueUsers,
    callsToday,
    callsThisWeek,
    urgentCallsWeek,
    urgentCalls24h,
    pendingRequests,
    newSignupsToday,
    clientCount,
    clientUsers,
    recentCalls,
    recentRequests,
    signupsThisWeek,
  ] = await Promise.all([
    prisma.user.findMany({ where: { subscriptionStatus: "active" }, select: { plan: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: "trialing" }, select: { plan: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: "past_due" }, select: { name: true, email: true } }),
    prisma.callLog.count({ where: { callDate: { gte: todayStart } } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart } } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart }, urgent: true } }),
    prisma.callLog.findMany({ where: { callDate: { gte: yesterday }, urgent: true }, include: { patient: { select: { firstName: true, lastName: true } } } }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true, name: true, email: true, plan: true, subscriptionStatus: true, stripeCustomerId: true, createdAt: true,
        patients: {
          take: 1,
          select: {
            firstName: true, lastName: true,
            callLogs: { orderBy: { callDate: "desc" }, take: 1, select: { callDate: true } },
            _count: { select: { callLogs: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.callLog.findMany({
      orderBy: { callDate: "desc" },
      take: 10,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: weekStart } } }),
  ]);

  // MRR calculations
  const mrr = activeUsers.reduce((sum, u) => sum + (PLAN_PRICES[u.plan || ""] || 0), 0);
  const pipelineMrr = trialingUsers.reduce((sum, u) => sum + (PLAN_PRICES[u.plan || ""] || 0), 0);
  const totalPotential = mrr + pipelineMrr;
  const totalConverting = activeUsers.length + trialingUsers.length;
  const conversionRate = totalConverting > 0 ? Math.round((activeUsers.length / totalConverting) * 100) : 0;

  // Fetch trial end dates from Stripe for trialing clients
  const trialingClients = clientUsers.filter((u: any) => u.subscriptionStatus === "trialing" && u.stripeCustomerId);
  const SK = process.env.STRIPE_SECRET_KEY;
  const auth = SK ? Buffer.from(SK + ":").toString("base64") : "";

  const trialEndMap: Record<string, string | null> = {};
  if (auth && trialingClients.length > 0) {
    const trialResults = await Promise.all(
      trialingClients.map(async (u: any) => {
        try {
          const res = await fetch(
            "https://api.stripe.com/v1/subscriptions?customer=" + u.stripeCustomerId + "&status=trialing&limit=1",
            { headers: { Authorization: "Basic " + auth }, cache: "no-store" }
          );
          const sdata = await res.json();
          const trialEnd = sdata?.data?.[0]?.trial_end
            ? new Date(sdata.data[0].trial_end * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : null;
          return { id: u.id, trialEnd };
        } catch {
          return { id: u.id, trialEnd: null };
        }
      })
    );
    trialResults.forEach((r) => { trialEndMap[r.id] = r.trialEnd; });
  }

  const hasAlerts = pastDueUsers.length > 0 || urgentCalls24h.length > 0 || newSignupsToday > 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <header className="bg-[#0f172a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white text-xl font-bold tracking-tight">KinCare360</span>
            <span className="bg-teal/20 text-teal text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-400 text-sm">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <Link href="/" className="text-sm text-teal hover:text-teal/80 transition-colors font-medium">
              View Site &rarr;
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* SECTION 1: Revenue & Growth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Revenue</span>
            </div>
            <div className="text-3xl font-bold text-[#0f172a]">${mrr.toLocaleString()}<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <div className="text-sm text-gray-500 mt-1">from {activeUsers.length} active subscriber{activeUsers.length !== 1 ? "s" : ""}</div>
          </div>

          {/* Pipeline */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pipeline</span>
            </div>
            <div className="text-3xl font-bold text-[#0f172a]">${pipelineMrr.toLocaleString()}<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <div className="text-sm text-gray-500 mt-1">{trialingUsers.length} trial{trialingUsers.length !== 1 ? "s" : ""} converting</div>
          </div>

          {/* Total Revenue Potential */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Potential</span>
            </div>
            <div className="text-3xl font-bold text-[#0f172a]">${totalPotential.toLocaleString()}<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <div className="text-sm text-gray-500 mt-1">if all trials convert</div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm border-l-4 border-l-teal">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversion Rate</span>
            </div>
            <div className="text-3xl font-bold text-[#0f172a]">{conversionRate}%</div>
            <div className="text-sm text-gray-500 mt-1">{activeUsers.length} of {totalConverting} converted</div>
          </div>
        </div>

        {/* SECTION 2: Activity Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Clients</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{clientCount}</div>
          </div>
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Calls Today</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{callsToday}</div>
          </div>
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Calls This Week</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{callsThisWeek}</div>
          </div>
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Urgent This Week</div>
            <div className={`text-2xl font-bold mt-1 ${urgentCallsWeek > 0 ? "text-red-600" : "text-[#0f172a]"}`}>{urgentCallsWeek}</div>
          </div>
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pending Requests</div>
            <div className={`text-2xl font-bold mt-1 ${pendingRequests > 0 ? "text-orange-600" : "text-[#0f172a]"}`}>{pendingRequests}</div>
          </div>
        </div>

        {/* SECTION 3: Alerts */}
        {hasAlerts && (
          <div className="space-y-2 mb-8">
            {pastDueUsers.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
                <span>{"\u26A0\uFE0F"} Payment Failed: {pastDueUsers.map((u: any) => u.name || u.email).join(", ")}</span>
              </div>
            )}
            {urgentCalls24h.map((c: any) => {
              const hoursAgo = Math.round((now.getTime() - new Date(c.callDate).getTime()) / 3600000);
              return (
                <div key={c.id} className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
                  <span>{"\u{1F6A8}"} Urgent: {c.patient.firstName} {c.patient.lastName} flagged {hoursAgo} hour{hoursAgo !== 1 ? "s" : ""} ago</span>
                </div>
              );
            })}
            {newSignupsToday > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
                <span>{"\u{1F389}"} {newSignupsToday} new signup{newSignupsToday > 1 ? "s" : ""} today</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Clients Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#0f172a]">Clients</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{clientUsers.length}</span>
            </div>
            <button disabled className="text-sm text-gray-400 border border-gray-200 rounded-lg px-4 py-2 cursor-not-allowed flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trial Ends</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Call</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Calls</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientUsers.map((c: any, i: number) => {
                    const patient = c.patients?.[0];
                    const lastCall = patient?.callLogs?.[0]?.callDate;
                    const totalCalls = patient?._count?.callLogs || 0;
                    const initials = (c.name || c.email || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <tr key={c.id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                        <td className="px-4 py-4 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-[#0f172a]">{c.name || "\u2014"}</div>
                              <div className="text-xs text-gray-400">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {patient ? `${patient.firstName} ${patient.lastName}` : "\u2014"}
                        </td>
                        <td className="px-4 py-4">
                          {c.plan === "CONCIERGE" || c.plan === "CONCIERGE_FAMILY" || c.plan === "COMPLETE" || c.plan === "COMPLETE_FAMILY" ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-teal to-blue-500 text-white">{c.plan}</span>
                          ) : c.plan === "PLUS" || c.plan === "PLUS_FAMILY" ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">{c.plan}</span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{c.plan || "\u2014"}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {c.subscriptionStatus === "active" ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                          ) : c.subscriptionStatus === "trialing" ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Trial</span>
                          ) : c.subscriptionStatus === "past_due" ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">{"\u26A0"} Past Due</span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{c.subscriptionStatus || "\u2014"}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-600 text-sm">
                          {c.subscriptionStatus === "trialing"
                            ? (trialEndMap[c.id] || "\u2014")
                            : c.subscriptionStatus === "active"
                              ? "Active"
                              : "\u2014"}
                        </td>
                        <td className="px-4 py-4 text-gray-600 text-sm">
                          {lastCall ? relativeDate(new Date(lastCall)) : "\u2014"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-[#0f172a] font-semibold">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {totalCalls}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-sm">
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/admin/clients/${c.id}`} className="text-xs text-teal font-semibold hover:underline">
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {clientUsers.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No clients yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 5: Two columns — Recent Calls + Recent Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Recent Calls (60%) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0f172a]">Recent Calls</h2>
              <span className="text-sm text-gray-400 cursor-default">View All</span>
            </div>
            <div className="space-y-2">
              {recentCalls.map((log: any) => {
                const moodColor = log.mood === "happy" ? "bg-green-100 text-green-700"
                  : (log.mood === "sad" || log.mood === "concerned") ? "bg-red-100 text-red-700"
                  : log.mood ? "bg-gray-100 text-gray-600" : null;
                return (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-teal/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0f172a]">{log.patient.firstName} {log.patient.lastName}</span>
                        {log.callType && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.callType}</span>
                        )}
                        {log.urgent && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{"\u26A0"} Urgent</span>
                        )}
                      </div>
                    </div>
                    {log.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{log.summary}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>
                        {new Date(log.callDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        {new Date(log.callDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      {moodColor && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${moodColor}`}>{log.mood}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {recentCalls.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400">No call logs yet.</div>
              )}
            </div>
          </div>

          {/* Recent Service Requests (40%) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0f172a]">Recent Requests</h2>
            </div>
            <div className="space-y-2">
              {recentRequests.map((r: any) => {
                const statusColor = r.status === "PENDING" ? "bg-yellow-100 text-yellow-700"
                  : r.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700"
                  : r.status === "DONE" ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600";
                const desc = r.description || "";
                const cleanDesc = desc.replace(/DATE:\s*[^\n,;]*/i, "").replace(/DOCTOR:\s*[^\n,;]*/i, "").trim().slice(0, 50);
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-teal/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{typeIcons[r.type] || "\u{1F4CB}"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[#0f172a] text-sm">{r.patient.firstName} {r.patient.lastName}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{r.status}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{typeLabels[r.type] || r.type}</div>
                        {cleanDesc && <p className="text-xs text-gray-400 mt-1 truncate">{cleanDesc}</p>}
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentRequests.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400">No requests yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button disabled className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-teal/30 transition-colors cursor-not-allowed opacity-60">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0f172a]">Send Announcement</div>
              <div className="text-xs text-gray-400">Coming soon</div>
            </div>
          </button>

          <button disabled className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-teal/30 transition-colors cursor-not-allowed opacity-60">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0f172a]">Export Data</div>
              <div className="text-xs text-gray-400">Coming soon</div>
            </div>
          </button>

          <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-teal/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0f172a]">VAPI Dashboard</div>
              <div className="text-xs text-gray-400">Open voice AI console</div>
            </div>
          </a>
        </div>

        {/* SECTION 7: Marketing & Growth */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📣</span>
            <h2 className="text-lg font-semibold text-[#0f172a]">Marketing & Growth</h2>
          </div>

          {/* Row 1: Platform Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {[
              { icon: "📘", title: "Facebook Page", subtitle: "Posts, followers, reach", link: "https://www.facebook.com/" },
              { icon: "📸", title: "Instagram", subtitle: "Stories, reels, engagement", link: "https://www.instagram.com/" },
              { icon: "📊", title: "Google Analytics", subtitle: "Website traffic & conversions", link: "https://analytics.google.com/" },
              { icon: "🗺️", title: "Google Business", subtitle: "Reviews, local search", link: "https://business.google.com/" },
            ].map((platform) => (
              <a
                key={platform.title}
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-teal/40 hover:shadow-md transition-all flex flex-col"
              >
                <span className="text-3xl mb-3">{platform.icon}</span>
                <div className="font-bold text-[#0f172a]">{platform.title}</div>
                <div className="text-sm text-gray-500 mb-4">{platform.subtitle}</div>
                <span className="mt-auto text-sm font-semibold text-teal hover:underline">Open Dashboard &rarr;</span>
              </a>
            ))}
          </div>

          {/* Row 2: Website Traffic Metrics (placeholder) */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium mb-4 flex items-center gap-2">
              <span>📡</span> Connect Google Analytics to see real data
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Website Visitors", sub: "this month" },
                { label: "Signup Conversion Rate", sub: "visitors → signups" },
                { label: "Top Traffic Source", sub: "referrer" },
                { label: "Page Views", sub: "this month" },
              ].map((metric) => (
                <div key={metric.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm opacity-60 relative">
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Requires setup</span>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{metric.label}</div>
                  <div className="text-3xl font-bold text-gray-300 mt-2">--</div>
                  <div className="text-xs text-gray-400 mt-1">{metric.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 mt-4">
              To connect real analytics: Add Google Analytics 4 to your site, then contact support to enable the API integration.
            </div>
          </div>

          {/* Row 3: Outreach Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-5 transition-all flex flex-col items-start"
            >
              <span className="text-2xl mb-2">✍️</span>
              <div className="font-bold text-[#0f172a]">Write a Facebook Post</div>
              <div className="text-sm text-gray-500">Draft and schedule content</div>
            </a>

            <div className="bg-teal/5 border border-teal/20 rounded-2xl p-5 flex flex-col items-start">
              <span className="text-2xl mb-2">📈</span>
              <div className="font-bold text-[#0f172a]">View Call to Action Stats</div>
              <div className="text-sm text-gray-500">Track signups from campaigns</div>
              <div className="text-3xl font-bold text-teal mt-3">{signupsThisWeek}</div>
              <div className="text-xs text-gray-500">new client signups this week</div>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 opacity-60 cursor-not-allowed flex flex-col items-start">
              <span className="text-2xl mb-2">💬</span>
              <div className="font-bold text-[#0f172a]">SMS/Text Campaign</div>
              <div className="text-sm text-gray-500">Coming soon via Twilio</div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
