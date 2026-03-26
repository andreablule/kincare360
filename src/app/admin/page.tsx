import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const [
    totalUsers,
    activeSubscriptions,
    trialingSubscriptions,
    callsToday,
    callsThisWeek,
    urgentCallsThisWeek,
    totalPatients,
    recentCallLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: "active" } }),
    prisma.user.count({ where: { subscriptionStatus: "trialing" } }),
    prisma.callLog.count({ where: { callDate: { gte: todayStart } } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart } } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart }, urgent: true } }),
    prisma.patient.count(),
    prisma.callLog.findMany({
      orderBy: { callDate: "desc" },
      take: 10,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const metrics = [
    { label: "Total Users", value: totalUsers },
    { label: "Active Subscriptions", value: activeSubscriptions },
    { label: "Trialing Subscriptions", value: trialingSubscriptions },
    { label: "Calls Today", value: callsToday },
    { label: "Calls This Week", value: callsThisWeek },
    { label: "Urgent Calls This Week", value: urgentCallsThisWeek, urgent: true },
    { label: "Total Patients", value: totalPatients },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="text-sm text-gray-500">{m.label}</div>
            <div className={`text-2xl font-bold mt-1 ${m.urgent ? "text-red-600" : "text-navy"}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-navy mb-3">Recent Call Logs</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Urgent</th>
              <th className="px-4 py-3 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody>
            {recentCallLogs.map((log: any) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">{log.patient.firstName} {log.patient.lastName}</td>
                <td className="px-4 py-3">{new Date(log.callDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{log.callType || "—"}</td>
                <td className="px-4 py-3">
                  {log.urgent ? (
                    <span className="text-red-600 font-semibold">YES</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {log.summary ? (log.summary.length > 100 ? log.summary.slice(0, 100) + "..." : log.summary) : "—"}
                </td>
              </tr>
            ))}
            {recentCallLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No call logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
