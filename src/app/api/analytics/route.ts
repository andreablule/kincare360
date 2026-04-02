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
    const [overview] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
      ],
    });

    const [sources] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 1,
    });

    const vals = overview.rows?.[0]?.metricValues?.map((v) => v.value) || [];
    const topSource = sources.rows?.[0]?.dimensionValues?.[0]?.value || "--";
    const topSourceSessions = sources.rows?.[0]?.metricValues?.[0]?.value || "0";

    return NextResponse.json({
      visitors: parseInt(vals[0] || "0"),
      sessions: parseInt(vals[1] || "0"),
      pageViews: parseInt(vals[2] || "0"),
      bounceRate: (parseFloat(vals[3] || "0") * 100).toFixed(1),
      topSource,
      topSourceSessions: parseInt(topSourceSessions),
    });
  } catch (err: any) {
    console.error("[analytics] GA error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
