import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MissionClient from "./MissionClient";

function easternMidnightToday(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(new Date());
  const y = parseInt(parts.find(p => p.type === 'year')!.value);
  const m = parseInt(parts.find(p => p.type === 'month')!.value);
  const d = parseInt(parts.find(p => p.type === 'day')!.value);
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
  const offsetHours = tzName === 'EDT' ? 4 : 5;
  return new Date(Date.UTC(y, m - 1, d, offsetHours, 0, 0));
}

export default async function MissionPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com" && user.email !== "andreablule@gmail.com")) {
    redirect("/login?callbackUrl=/admin/mission");
  }

  const todayStart = easternMidnightToday();
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalCalls,
    callsToday,
    callsThisWeek,
    clients,
    activeSubscribers,
    trialingUsers,
    totalProspects,
    newProspectsToday,
    prospects,
    recentCalls,
    referrals,
    pendingRequests,
  ] = await Promise.all([
    prisma.callLog.count(),
    prisma.callLog.count({ where: { callDate: { gte: todayStart }, NOT: { summary: { contains: 'call initiated' } } } }),
    prisma.callLog.count({ where: { callDate: { gte: weekStart }, NOT: { summary: { contains: 'call initiated' } } } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { subscriptionStatus: 'active' } }),
    prisma.user.count({ where: { subscriptionStatus: 'trialing' } }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.prospect.findMany({ orderBy: { lastCallAt: 'desc' }, take: 10 }),
    prisma.callLog.findMany({
      orderBy: { callDate: 'desc' }, take: 10,
      where: { NOT: { summary: { contains: 'call initiated' } } },
      include: { patient: { select: { firstName: true, lastName: true, phone: true } } }
    }),
    prisma.referral.count(),
    prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
  ]);

  const data = {
    totalCalls, callsToday, callsThisWeek, clients, activeSubscribers,
    trialingUsers, totalProspects, newProspectsToday, referrals, pendingRequests,
    prospects: prospects.map(p => ({ ...p, lastCallAt: p.lastCallAt.toISOString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })),
    recentCalls: recentCalls.map(c => ({ ...c, callDate: c.callDate.toISOString(), createdAt: c.createdAt.toISOString() })),
  };

  return <MissionClient data={data} />;
}
