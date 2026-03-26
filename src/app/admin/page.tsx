import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = { BASIC: 99, STANDARD: 199, PREMIUM: 299 };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com")) {
    redirect("/login");
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
    allCalls,
    urgentCallsWeek,
    urgentCalls24h,
    pendingRequests,
    newSignupsToday,
    clientUsers,
    recentCalls,
    recentRequests,
  ] = await Promise.all([
    prisma.user.findMany({ where: { subscriptionStatus: "active" }, select: { plan: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: "trialing" }, select: { plan: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: "past_due" }, select: { name: true, email: true } }),
    prisma.callLog.count(),
    prisma.callLog.count({ where: { callDate: { gte: weekStart }, urgent: true } }),
    prisma.callLog.findMany({ where: { callDate: { gte: yesterday }, urgent: true }, include: { patient: { select: { firstName: true, lastName: true } } } }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true, name: true, email: true, plan: true, subscriptionStatus: true, stripeCustomerId: true,
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
      take: 15,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  // MRR calculations
  const mrr = activeUsers.reduce((sum, u) => sum + (PLAN_PRICES[u.plan || ""] || 0), 0);
  const pipelineMrr = trialingUsers.reduce((sum, u) => sum + (PLAN_PRICES[u.plan || ""] || 0), 0);

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

  const kpis = [
    { label: "MRR", value: `$${mrr.toLocaleString()}/mo` },
    { label: "Pipeline MRR", value: `$${pipelineMrr.toLocaleString()}/mo` },
    { label: "Active Clients", value: activeUsers.length },
    { label: "Free Trials", value: trialingUsers.length },
    { label: "Total Calls", value: allCalls },
    { label: "Urgent This Week", value: urgentCallsWeek, urgent: true },
    { label: "Pending Requests", value: pendingRequests },
  ];

  const planBadge = (plan: string | null) => {
    if (plan === "PREMIUM") return "bg-teal/10 text-teal";
    if (plan === "STANDARD") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  const statusBadge = (status: string | null) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "trialing") return "bg-blue-100 text-blue-700";
    if (status === "past_due") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const reqStatusBadge = (status: string) => {
    if (status === "PENDING") return "bg-yellow-100 text-yellow-700";
    if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
    if (status === "DONE") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  };

  const typeLabels: Record<string, string> = {
    APPOINTMENT: "Appointment",
    FOLLOWUP: "Follow-up",
    MEDICATION_CHANGE: "Medication",
    OTHER: "Other",
  };

  const hasAlerts = pastDueUsers.length > 0 || urgentCalls24h.length > 0 || newSignupsToday > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Owner Dashboard</h1>

      {/* SECTION 1 — KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs text-gray-500 font-medium">{k.label}</div>
            <div className={`text-xl font-bold mt-1 ${k.urgent ? "text-red-600" : "text-navy"}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* SECTION 2 — Alerts */}
      {hasAlerts && (
        <div className="space-y-2 mb-6">
          {pastDueUsers.map((u: any) => (
            <div key={u.email} className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium">
              ⚠️ Past-due: {u.name || u.email}
            </div>
          ))}
          {urgentCalls24h.map((c: any) => (
            <div key={c.id} className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium">
              🚨 Urgent call — {c.patient.firstName} {c.patient.lastName}
            </div>
          ))}
          {newSignupsToday > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 font-medium">
              🟢 {newSignupsToday} new signup{newSignupsToday > 1 ? "s" : ""} today
            </div>
          )}
        </div>
      )}

      {/* SECTION 3 — Clients Table */}
      <h2 className="text-lg font-semibold text-navy mb-3">Clients</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Name / Email</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Trial End</th>
              <th className="px-4 py-3 font-medium">Last Call</th>
              <th className="px-4 py-3 font-medium">Calls</th>
              <th className="px-4 py-3 font-medium">Patient</th>
            </tr>
          </thead>
          <tbody>
            {clientUsers.map((c: any) => {
              const patient = c.patients?.[0];
              const lastCall = patient?.callLogs?.[0]?.callDate;
              const totalCalls = patient?._count?.callLogs || 0;
              return (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy">{c.name || "—"}</div>
                    <div className="text-xs text-gray-400">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${planBadge(c.plan)}`}>
                      {c.plan || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(c.subscriptionStatus)}`}>
                      {c.subscriptionStatus || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.subscriptionStatus === "trialing" ? (trialEndMap[c.id] || "—") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {lastCall ? new Date(lastCall).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-navy font-medium">{totalCalls}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {patient ? `${patient.firstName} ${patient.lastName}` : "—"}
                  </td>
                </tr>
              );
            })}
            {clientUsers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No clients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECTION 4 — Recent Calls */}
      <h2 className="text-lg font-semibold text-navy mb-3">Recent Calls</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Date / Time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Urgent</th>
              <th className="px-4 py-3 font-medium">Summary</th>
              <th className="px-4 py-3 font-medium">Mood</th>
            </tr>
          </thead>
          <tbody>
            {recentCalls.map((log: any) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-navy">{log.patient.firstName} {log.patient.lastName}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(log.callDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                  {new Date(log.callDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">{log.callType || "—"}</td>
                <td className="px-4 py-3">
                  {log.urgent ? <span className="text-red-600 font-semibold">⚠️ YES</span> : <span className="text-gray-400">No</span>}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {log.summary ? (log.summary.length > 80 ? log.summary.slice(0, 80) + "…" : log.summary) : "—"}
                </td>
                <td className="px-4 py-3">{log.mood || "—"}</td>
              </tr>
            ))}
            {recentCalls.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No call logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECTION 5 — Recent Service Requests */}
      <h2 className="text-lg font-semibold text-navy mb-3">Recent Service Requests</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {recentRequests.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-navy">{r.patient.firstName} {r.patient.lastName}</td>
                <td className="px-4 py-3">{typeLabels[r.type] || r.type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${reqStatusBadge(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {r.description ? (r.description.length > 60 ? r.description.slice(0, 60) + "…" : r.description) : "—"}
                </td>
              </tr>
            ))}
            {recentRequests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No service requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
