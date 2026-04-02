"use client";

import { useEffect, useState } from "react";

interface GAData {
  visitors: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: string;
  visitorsToday: number;
  sessionsToday: number;
  pageViewsToday: number;
  sources: { source: string; sessions: number; users: number }[];
  pages: { path: string; views: number; users: number }[];
  devices: { device: string; users: number }[];
  referrers: { referrer: string; sessions: number }[];
  cities: { city: string; country: string; users: number; sessions: number }[];
}

export default function AnalyticsCards() {
  const [data, setData] = useState<GAData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(true);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-14 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 font-medium flex items-center gap-2">
        <span>⚠️</span> Unable to load Google Analytics data. Check configuration.
      </div>
    );
  }

  const totalDeviceUsers = data.devices.reduce((s, d) => s + d.users, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Visitors Today", value: data.visitorsToday, color: "border-l-green-500", icon: "🟢" },
          { label: "Visitors (30d)", value: data.visitors, color: "border-l-indigo-500", icon: "👥" },
          { label: "New Users (30d)", value: data.newUsers, color: "border-l-teal", icon: "🆕" },
          { label: "Page Views (30d)", value: data.pageViews, color: "border-l-blue-500", icon: "📄" },
          { label: "Avg Session", value: `${Math.floor(data.avgSessionDuration / 60)}m ${data.avgSessionDuration % 60}s`, color: "border-l-purple-500", icon: "⏱️" },
          { label: "Bounce Rate", value: `${data.bounceRate}%`, color: "border-l-orange-500", icon: "↩️" },
        ].map((card) => (
          <div key={card.label} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm border-l-4 ${card.color}`}>
            <div className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">{card.label}</div>
            <div className="text-2xl font-bold text-[#0f172a] mt-1">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Traffic Sources</h3>
          <div className="space-y-2">
            {data.sources.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="text-[#0f172a] font-medium truncate">{s.source}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{s.users} users</span>
                  <span className="font-semibold text-[#0f172a] w-8 text-right">{s.sessions}</span>
                </div>
              </div>
            ))}
            {data.sources.length === 0 && <p className="text-xs text-gray-400">No data yet</p>}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Pages</h3>
          <div className="space-y-2">
            {data.pages.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm">
                <span className="text-[#0f172a] font-mono text-xs truncate max-w-[180px]">{p.path}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{p.users} users</span>
                  <span className="font-semibold text-[#0f172a] w-10 text-right">{p.views}</span>
                </div>
              </div>
            ))}
            {data.pages.length === 0 && <p className="text-xs text-gray-400">No data yet</p>}
          </div>
        </div>

        {/* Devices + Cities */}
        <div className="space-y-5">
          {/* Devices */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Devices</h3>
            <div className="space-y-2">
              {data.devices.map((d) => {
                const pct = Math.round((d.users / totalDeviceUsers) * 100);
                return (
                  <div key={d.device}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#0f172a] font-medium capitalize">{d.device}</span>
                      <span className="font-semibold text-[#0f172a]">{d.users} <span className="text-xs text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-teal rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Locations</h3>
            <div className="space-y-2">
              {data.cities.filter(c => c.city !== "(not set)").slice(0, 5).map((c) => (
                <div key={c.city + c.country} className="flex items-center justify-between text-sm">
                  <span className="text-[#0f172a] font-medium truncate">{c.city}</span>
                  <span className="text-xs text-gray-400 shrink-0">{c.users} users · {c.sessions} sessions</span>
                </div>
              ))}
              {data.cities.length === 0 && <p className="text-xs text-gray-400">No data yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
