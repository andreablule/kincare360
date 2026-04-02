"use client";

import { useEffect, useState } from "react";

interface GAData {
  visitors: number;
  sessions: number;
  pageViews: number;
  bounceRate: string;
  topSource: string;
  topSourceSessions: number;
}

export default function AnalyticsCards() {
  const [data, setData] = useState<GAData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(true);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        ))}
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

  const cards = [
    { label: "Website Visitors", value: data.visitors.toLocaleString(), sub: "last 30 days", color: "border-l-indigo-500" },
    { label: "Page Views", value: data.pageViews.toLocaleString(), sub: "last 30 days", color: "border-l-blue-500" },
    { label: "Bounce Rate", value: `${data.bounceRate}%`, sub: "last 30 days", color: "border-l-orange-500" },
    { label: "Top Traffic Source", value: data.topSource, sub: `${data.topSourceSessions} sessions`, color: "border-l-green-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div key={card.label} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm border-l-4 ${card.color}`}>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{card.label}</div>
          <div className="text-3xl font-bold text-[#0f172a] mt-2">{card.value}</div>
          <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
