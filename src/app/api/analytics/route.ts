import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const PROPERTY_ID = "530245386";

function getClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;
  try {
    const credentials = JSON.parse(keyJson);
    return new BetaAnalyticsDataClient({ credentials });
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.email !== "hello@kincare360.com")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "GA not configured" }, { status: 500 });
  }

  try {
    // Run all queries in parallel
    const [overviewRes, todayRes, sourcesRes, pagesRes, devicesRes, referrersRes, countriesRes] = await Promise.all([
      // 30-day overview
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      }),
      // Today
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      // Traffic sources (30d)
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      // Top pages (30d)
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
      // Devices (30d)
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
      // Referrers (30d)
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      // Countries/Cities (30d)
      client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "city" }, { name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
    ]);

    const vals30d = overviewRes[0].rows?.[0]?.metricValues?.map((v) => v.value) || [];
    const valsToday = todayRes[0].rows?.[0]?.metricValues?.map((v) => v.value) || ["0", "0", "0"];

    const sources = (sourcesRes[0].rows || []).map((r) => ({
      source: r.dimensionValues![0].value,
      sessions: parseInt(r.metricValues![0].value || "0"),
      users: parseInt(r.metricValues![1].value || "0"),
    }));

    const pages = (pagesRes[0].rows || []).map((r) => ({
      path: r.dimensionValues![0].value,
      views: parseInt(r.metricValues![0].value || "0"),
      users: parseInt(r.metricValues![1].value || "0"),
    }));

    const devices = (devicesRes[0].rows || []).map((r) => ({
      device: r.dimensionValues![0].value,
      users: parseInt(r.metricValues![0].value || "0"),
    }));

    const referrers = (referrersRes[0].rows || []).map((r) => ({
      referrer: r.dimensionValues![0].value,
      sessions: parseInt(r.metricValues![0].value || "0"),
    }));

    const cities = (countriesRes[0].rows || []).map((r) => ({
      city: r.dimensionValues![0].value,
      country: r.dimensionValues![1].value,
      users: parseInt(r.metricValues![0].value || "0"),
      sessions: parseInt(r.metricValues![1].value || "0"),
    }));

    return NextResponse.json({
      // Overview (30d)
      visitors: parseInt(vals30d[0] || "0"),
      newUsers: parseInt(vals30d[1] || "0"),
      sessions: parseInt(vals30d[2] || "0"),
      pageViews: parseInt(vals30d[3] || "0"),
      avgSessionDuration: Math.round(parseFloat(vals30d[4] || "0")),
      bounceRate: (parseFloat(vals30d[5] || "0") * 100).toFixed(1),
      // Today
      visitorsToday: parseInt(valsToday[0]),
      sessionsToday: parseInt(valsToday[1]),
      pageViewsToday: parseInt(valsToday[2]),
      // Breakdowns
      sources,
      pages,
      devices,
      referrers,
      cities,
    });
  } catch (err: any) {
    console.error("[analytics] GA error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
