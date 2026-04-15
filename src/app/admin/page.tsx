import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RecentCallsClient from "./RecentCallsClient";
import ProspectsSection from "./ProspectsSection";
import KpiCardClickable from "./KpiCardClickable";
import AnalyticsCards from "./AnalyticsCards";

const PLAN_PRICES: Record<string, number> = { ESSENTIAL: 50, PLUS: 80, CONCIERGE: 110, ESSENTIAL_FAMILY: 75, PLUS_FAMILY: 130, CONCIERGE_FAMILY: 180, COMPLETE: 110, COMPLETE_FAMILY: 180, INDIVIDUAL: 99, FAMILY: 149 };

// Eastern Time helpers — Vercel runs UTC, all boundaries must be ET
function easternMidnightToday(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(new Date());
  const y = parseInt(parts.find(p => p.type === 'year')!.value);
  const m = parseInt(parts.find(p => p.type === 'month')!.value);
  const d = parseInt(parts.find(p => p.type === 'day')!.value);
  // Determine EDT (-4) vs EST (-5)
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
  const offsetHours = tzName === 'EDT' ? 4 : 5;
  return new Date(Date.UTC(y, m - 1, d, offsetHours, 0, 0));
}

function formatDateET(date: Date): string {
  return date.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Filter out initiation-only logs (duplicates)
const realCallFilter = { NOT: { summary: { contains: 'call initiated' } } } as const;

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
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // DB or auth error — show error instead of redirect loop
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Unable to load admin panel</h1>
          <p className="text-gray-500 mb-4">Session could not be verified. This is usually a temporary database issue.</p>
          <a href="/admin" className="text-teal font-semibold hover:underline">Try again</a>
          {" · "}
          <a href="/login" className="text-teal font-semibold hover:underline">Go to login</a>
        </div>
      </div>
    );
  }
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com" && user.email !== "andreablule@gmail.com")) {
    redirect("/login?callbackUrl=/admin");
  }

  let now: Date, todayStart: Date, weekStart: Date, yesterday: Date;
  try {

  now = new Date();
  todayStart = easternMidnightToday();
  weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  yesterday = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  // Build daily date boundaries for last 7 days
  const dailyBoundaries: { label: string; start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dailyBoundaries.push({
      label: dayStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      start: dayStart,
      end: dayEnd,
    });
  }

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
    // Analytics additions
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    activeSubscribers,
    totalReferralCodes,
    referralAgg,
    recentSignups,
    recentReferrals,
    usersWithPatients,
    subscribedUsers,
    prospects,
    newCallersToday,
    ...dailySignupCounts
  ] = await Promise.all([
    prisma.user.findMany({ where: { subscriptionStatus: "active" }, select: { plan: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: "trialing" }, select: { plan: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: "past_due" }, select: { name: true, email: true } }),
    prisma.callLog.count({ where: { callDate: { gte: todayStart }, ...realCallFilter } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart }, ...realCallFilter } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart }, urgent: true, ...realCallFilter } }),
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
      take: 20,
      where: realCallFilter,
      include: { patient: { select: { firstName: true, lastName: true, phone: true } } },
    }),
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: weekStart } } }),
    // Analytics: Total users
    prisma.user.count(),
    // Analytics: New users today
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    // Analytics: New users this week
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    // Analytics: Active subscribers
    prisma.user.count({ where: { subscriptionStatus: { in: ["active", "trialing"] } } }),
    // Analytics: Referral codes created
    prisma.referral.count(),
    // Analytics: Total referrals used (aggregate sum)
    prisma.referral.aggregate({ _sum: { referralCount: true } }),
    // Analytics: Recent signups (last 10)
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    // Analytics: Recent referral creations (last 10)
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, code: true, referrerName: true, type: true, createdAt: true },
    }),
    // Analytics: Users who completed intake (have patients)
    prisma.user.count({ where: { patients: { some: {} } } }),
    // Analytics: Subscribed users
    prisma.user.count({ where: { subscriptionStatus: { in: ["active", "trialing"] } } }),
    // Prospects: unknown callers
    prisma.prospect.findMany({ orderBy: { lastCallAt: "desc" } }),
    // New callers today (prospects created today)
    prisma.prospect.findMany({ where: { createdAt: { gte: todayStart } }, orderBy: { createdAt: "desc" } }),
    // Analytics: Daily signups for last 7 days
    ...dailyBoundaries.map((d) => prisma.user.count({ where: { createdAt: { gte: d.start, lt: d.end } } })),
  ]);

  const totalReferralsUsed = referralAgg._sum?.referralCount || 0;

  // Build activity feed: signups, referrals, and NEW prospect calls only (not routine client calls)
  type ActivityItem = { type: "signup" | "call" | "referral" | "prospect"; date: Date; label: string; detail: string };
  const activityFeed: ActivityItem[] = [];
  (recentSignups as any[]).forEach((u) => {
    activityFeed.push({ type: "signup", date: new Date(u.createdAt), label: u.name || u.email, detail: u.email });
  });
  // Only show prospect/inbound calls, not routine outbound client calls
  (prospects as any[]).forEach((p: any) => {
    activityFeed.push({ type: "prospect", date: new Date(p.lastCallAt), label: p.name || p.phone, detail: p.summary?.slice(0, 60) || "New caller" });
  });
  (recentReferrals as any[]).forEach((r) => {
    activityFeed.push({ type: "referral", date: new Date(r.createdAt), label: r.referrerName, detail: `Code: ${r.code}` });
  });
  activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime());
  const activityFeedTop10 = activityFeed.slice(0, 10);

  // Daily signups data for chart
  const dailySignupsData = dailyBoundaries.map((d, i) => ({
    label: d.label,
    count: dailySignupCounts[i] as number,
  }));
  const maxDailySignup = Math.max(...dailySignupsData.map((d) => d.count), 1);

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

  const hasAlerts = pastDueUsers.length > 0 || urgentCalls24h.length > 0 || newSignupsToday > 0 || (newCallersToday as any[]).length > 0;

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

        {/* SECTION 0: Website Analytics (top priority) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a]">Website Analytics</h2>
              <p className="text-xs text-gray-400">Live data from Google Analytics</p>
            </div>
          </div>
          <AnalyticsCards />
        </div>

        {/* SECTION 1: Revenue & Growth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Monthly Revenue */}
          <KpiCardClickable title="Monthly Revenue" value={`$${mrr.toLocaleString()}/mo`} description="Sum of plan prices for all users with subscriptionStatus = 'active'">
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
          </KpiCardClickable>

          {/* Pipeline */}
          <KpiCardClickable title="Pipeline" value={`$${pipelineMrr.toLocaleString()}/mo`} description="Sum of plan prices for all users with subscriptionStatus = 'trialing'">
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
          </KpiCardClickable>

          {/* Total Revenue Potential */}
          <KpiCardClickable title="Total Potential" value={`$${totalPotential.toLocaleString()}/mo`} description="Monthly Revenue + Pipeline combined">
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
          </KpiCardClickable>

          {/* Conversion Rate */}
          <KpiCardClickable title="Conversion Rate" value={`${conversionRate}%`} description="Active subscribers ÷ (active + trialing) × 100">
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
          </KpiCardClickable>
        </div>

        {/* SECTION 2: Activity Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <KpiCardClickable title="Total Clients" value={clientCount} description="Count of all users with role = 'CLIENT'">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Clients</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{clientCount}</div>
          </div>
          </KpiCardClickable>
          <KpiCardClickable title="Calls Today" value={callsToday} description="Count of call logs with callDate >= today midnight">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Calls Today</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{callsToday}</div>
          </div>
          </KpiCardClickable>
          <KpiCardClickable title="Calls This Week" value={callsThisWeek} description="Count of call logs with callDate >= 7 days ago">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Calls This Week</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{callsThisWeek}</div>
          </div>
          </KpiCardClickable>
          <KpiCardClickable title="Urgent This Week" value={urgentCallsWeek} description="Count of call logs with urgent = true in last 7 days">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Urgent This Week</div>
            <div className={`text-2xl font-bold mt-1 ${urgentCallsWeek > 0 ? "text-red-600" : "text-[#0f172a]"}`}>{urgentCallsWeek}</div>
          </div>
          </KpiCardClickable>
          <KpiCardClickable title="Pending Requests" value={pendingRequests} description="Count of service requests with status = 'PENDING'">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pending Requests</div>
            <div className={`text-2xl font-bold mt-1 ${pendingRequests > 0 ? "text-orange-600" : "text-[#0f172a]"}`}>{pendingRequests}</div>
          </div>
          </KpiCardClickable>
          <KpiCardClickable title="No-Signup Callers" value={(prospects as any[]).length} description="Count of prospects (people who called but didn't register)">
          <div className="bg-white rounded-xl px-5 py-4 border border-gray-100 border-l-4 border-l-yellow-400">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">No-Signup Callers</div>
            <div className={`text-2xl font-bold mt-1 ${(prospects as any[]).length > 0 ? "text-yellow-600" : "text-[#0f172a]"}`}>{(prospects as any[]).length}</div>
          </div>
          </KpiCardClickable>
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
            {(newCallersToday as any[]).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-700 font-medium">
                <div className="flex items-center gap-2 mb-2">
                  <span>{"\u{1F4DE}"} {(newCallersToday as any[]).length} new caller{(newCallersToday as any[]).length > 1 ? "s" : ""} today</span>
                </div>
                <div className="space-y-1">
                  {(newCallersToday as any[]).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-semibold">{p.phone}</span>
                      <span className="text-blue-500">{p.name || "Unknown"}</span>
                      {p.summary && <span className="text-blue-400 truncate max-w-xs">{p.summary.slice(0, 60)}...</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: Live Analytics */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Live Analytics</h2>
          </div>

          {/* Analytics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Users", value: totalUsers, color: "border-l-indigo-500", description: "Count of all users in the database" },
              { label: "New Users Today", value: newUsersToday, color: "border-l-green-500", description: "Users created since midnight today" },
              { label: "New Users This Week", value: newUsersThisWeek, color: "border-l-blue-500", description: "Users created in the last 7 days" },
              { label: "Active Subscribers", value: activeSubscribers, color: "border-l-teal", description: "Users with subscriptionStatus = 'active' or 'trialing'" },
              { label: "Calls Today", value: callsToday, color: "border-l-orange-500", description: "Count of call logs with callDate >= today midnight" },
              { label: "Calls This Week", value: callsThisWeek, color: "border-l-yellow-500", description: "Count of call logs with callDate >= 7 days ago" },
              { label: "Referral Codes", value: totalReferralCodes, color: "border-l-pink-500", description: "Total referral codes created" },
              { label: "Referrals Used", value: totalReferralsUsed, color: "border-l-purple-500", description: "Sum of referralCount across all referral records" },
            ].map((kpi) => (
              <KpiCardClickable key={kpi.label} title={kpi.label} value={kpi.value} description={kpi.description}>
                <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm border-l-4 ${kpi.color}`}>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{kpi.label}</div>
                  <div className="text-3xl font-bold text-[#0f172a] mt-2">{kpi.value.toLocaleString()}</div>
                </div>
              </KpiCardClickable>
            ))}
          </div>

          {/* Activity Feed + Signup Funnel + GA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Activity Feed */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {activityFeedTop10.length === 0 && (
                  <div className="p-6 text-center text-gray-400">No recent activity.</div>
                )}
                {activityFeedTop10.map((item, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                      item.type === "signup" ? "bg-green-100 text-green-700" :
                      item.type === "prospect" ? "bg-yellow-100 text-yellow-700" :
                      item.type === "call" ? "bg-blue-100 text-blue-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>
                      {item.type === "signup" ? "\u{1F464}" : item.type === "prospect" ? "\u{1F4DE}" : item.type === "call" ? "\u{1F4DE}" : "\u{1F517}"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#0f172a] text-sm truncate">{item.label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.type === "signup" ? "bg-green-100 text-green-700" :
                          item.type === "prospect" ? "bg-yellow-100 text-yellow-700" :
                          item.type === "call" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {item.type === "signup" ? "Signup" : item.type === "prospect" ? "New Caller" : item.type === "call" ? "Call" : "Referral"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{item.detail}</div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">
                      {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                      {item.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: GA + Funnel */}
            <div className="space-y-6">
              {/* Google Analytics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Google Analytics</h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="text-xs text-gray-500 mb-3">GA Property ID: <span className="font-mono font-semibold text-[#0f172a]">G-FNXDMJDB3K</span></div>
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0f172a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1e293b] transition-colors w-full justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Google Analytics &rarr;
                  </a>
                </div>
              </div>

              {/* Signup Conversion Funnel */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Signup Funnel</h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  {[
                    { label: "Registered", value: totalUsers, pct: 100 },
                    { label: "Completed Intake", value: usersWithPatients, pct: totalUsers > 0 ? Math.round((usersWithPatients / totalUsers) * 100) : 0 },
                    { label: "Subscribed", value: subscribedUsers, pct: totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 100) : 0 },
                  ].map((step) => (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">{step.label}</span>
                        <span className="font-bold text-[#0f172a]">{step.value} <span className="text-xs text-gray-400 font-normal">({step.pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-teal rounded-full h-2 transition-all" style={{ width: `${step.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Signups Bar Chart (last 7 days) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Signups — Last 7 Days</h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-end gap-3 h-32">
                {dailySignupsData.map((d) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-[#0f172a]">{d.count}</span>
                    <div
                      className="w-full bg-teal/80 rounded-t-md transition-all"
                      style={{ height: `${Math.max((d.count / maxDailySignup) * 100, 4)}%` }}
                    />
                    <span className="text-[10px] text-gray-400 leading-tight text-center">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Prospects (Inbound callers who haven't signed up) */}
        <ProspectsSection prospects={prospects as any} />

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
                    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : null;
                    const displayName = patientName || c.name;
                    const initials = (displayName || c.email || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <tr key={c.id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                        <td className="px-4 py-4 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-[#0f172a]">{displayName || "\u2014"}</div>
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

          <Link href="/admin/calls" className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-teal/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0f172a]">Call Logs</div>
              <div className="text-xs text-gray-400">View VAPI live call feed</div>
            </div>
          </Link>
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

  } catch (err) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Admin panel temporarily unavailable</h1>
          <p className="text-gray-500 mb-4">Database query failed. This is usually a temporary issue with Neon cold starts.</p>
          <a href="/admin" className="bg-teal text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm">Reload</a>
        </div>
      </div>
    );
  }
}
