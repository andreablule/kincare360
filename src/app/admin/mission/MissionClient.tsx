"use client";

import { useEffect, useState } from "react";

interface MissionData {
  totalCalls: number;
  callsToday: number;
  callsThisWeek: number;
  clients: number;
  activeSubscribers: number;
  trialingUsers: number;
  totalProspects: number;
  newProspectsToday: number;
  referrals: number;
  pendingRequests: number;
  prospects: any[];
  recentCalls: any[];
}

interface GAData {
  visitors: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: string;
  visitorsToday: number;
  sources: { source: string; sessions: number }[];
  pages: { path: string; views: number }[];
  devices: { device: string; users: number }[];
  cities: { city: string; users: number; sessions: number }[];
}

export default function MissionClient({ data }: { data: MissionData }) {
  const [ga, setGa] = useState<GAData | null>(null);
  const [time, setTime] = useState(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(d => { if (!d.error) setGa(d); }).catch(() => {});
    const timer = setInterval(() => setTime(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{ fontSize: 28, color: "#fff", marginBottom: 4 }}>⚡ Mission Control</h1>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>KinCare360 — Real-time Command Center | {time}</p>

        {/* Lily Stats */}
        <Section icon="📞" title="Lily — AI Care Assistant">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <Card label="Calls Today" value={data.callsToday} color="#10b981" />
            <Card label="Calls This Week" value={data.callsThisWeek} color="#3b82f6" />
            <Card label="Total Calls" value={data.totalCalls} color="#8b5cf6" />
            <Card label="Clients" value={data.clients} color="#14b8a6" />
            <Card label="Active" value={data.activeSubscribers} color="#10b981" />
            <Card label="Trialing" value={data.trialingUsers} color="#f59e0b" />
            <Card label="Prospects" value={data.totalProspects} color="#ef4444" />
            <Card label="New Today" value={data.newProspectsToday} color="#f59e0b" />
          </div>
        </Section>

        {/* Google Analytics */}
        <Section icon="📊" title="Website Analytics (30 days)">
          {ga ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                <Card label="Visitors Today" value={ga.visitorsToday} color="#10b981" />
                <Card label="Visitors (30d)" value={ga.visitors} color="#6366f1" />
                <Card label="New Users" value={ga.newUsers} color="#14b8a6" />
                <Card label="Page Views" value={ga.pageViews} color="#3b82f6" />
                <Card label="Avg Session" value={`${Math.floor(ga.avgSessionDuration / 60)}m ${ga.avgSessionDuration % 60}s`} color="#8b5cf6" />
                <Card label="Bounce Rate" value={`${ga.bounceRate}%`} color="#f59e0b" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={boxStyle}>
                  <div style={boxTitleStyle}>Traffic Sources</div>
                  {ga.sources.slice(0, 6).map(s => (
                    <div key={s.source} style={rowStyle}>
                      <span>{s.source}</span><span style={{ color: "#10b981", fontWeight: 600 }}>{s.sessions}</span>
                    </div>
                  ))}
                </div>
                <div style={boxStyle}>
                  <div style={boxTitleStyle}>Top Pages</div>
                  {ga.pages.slice(0, 6).map(p => (
                    <div key={p.path} style={rowStyle}>
                      <span style={{ fontFamily: "monospace", fontSize: 12 }}>{p.path}</span><span style={{ color: "#3b82f6", fontWeight: 600 }}>{p.views}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={boxStyle}>
                  <div style={boxTitleStyle}>Devices</div>
                  {ga.devices.map(d => (
                    <div key={d.device} style={rowStyle}>
                      <span style={{ textTransform: "capitalize" }}>{d.device}</span><span>{d.users} users</span>
                    </div>
                  ))}
                </div>
                <div style={boxStyle}>
                  <div style={boxTitleStyle}>Top Locations</div>
                  {ga.cities.filter(c => c.city !== "(not set)").slice(0, 5).map(c => (
                    <div key={c.city} style={rowStyle}>
                      <span>{c.city}</span><span>{c.users} users</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "#444", fontSize: 14 }}>Loading analytics...</div>
          )}
        </Section>

        {/* Recent Calls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <Section icon="📋" title="Recent Calls">
            <div style={boxStyle}>
              {data.recentCalls.length === 0 && <div style={{ color: "#444", fontSize: 13 }}>No calls yet</div>}
              {data.recentCalls.map((c: any) => (
                <div key={c.id} style={{ ...rowStyle, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{c.patient.firstName} {c.patient.lastName}</span>
                    {c.patient.phone && <span style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>{c.patient.phone}</span>}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#444" }}>
                      {new Date(c.callDate).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  {c.summary && <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{c.summary.slice(0, 120)}{c.summary.length > 120 ? "..." : ""}</div>}
                </div>
              ))}
            </div>
          </Section>

          <Section icon="🔥" title="Prospects">
            <div style={boxStyle}>
              {data.prospects.length === 0 && <div style={{ color: "#444", fontSize: 13 }}>No prospects yet</div>}
              {data.prospects.map((p: any) => (
                <div key={p.id} style={rowStyle}>
                  <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{p.phone}</span>
                  <span style={{ color: "#999" }}>{p.name || "Unknown"}</span>
                  <span style={{ 
                    background: p.status === "NEW" ? "#422006" : p.status === "CONTACTED" ? "#0c1a3a" : p.status === "CONVERTED" ? "#052e16" : "#1a1a2a",
                    color: p.status === "NEW" ? "#f59e0b" : p.status === "CONTACTED" ? "#3b82f6" : p.status === "CONVERTED" ? "#10b981" : "#555",
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                  }}>{p.status}</span>
                  <span style={{ color: "#444", fontSize: 12 }}>{p.callCount} calls</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Quick Stats */}
        <Section icon="📈" title="Quick Stats">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <Card label="Referral Codes" value={data.referrals} color="#8b5cf6" />
            <Card label="Pending Requests" value={data.pendingRequests} color="#f59e0b" />
          </div>
        </Section>

        {/* Leka Note */}
        <div style={{ ...boxStyle, marginTop: 16, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>🤖 Leka Stats</div>
          <div style={{ fontSize: 12, color: "#666" }}>Leka runs on your laptop. View full Leka dashboard at <span style={{ color: "#14b8a6", fontFamily: "monospace" }}>http://localhost:3333</span> when your laptop is open.</div>
        </div>

        <div style={{ textAlign: "center", color: "#333", fontSize: 11, marginTop: 32, paddingBottom: 20 }}>
          Mission Control v1.0 — KinCare360
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: "#141420", border: "1px solid #1e1e30", borderLeft: `4px solid ${color}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "#666", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

const boxStyle: React.CSSProperties = { background: "#141420", border: "1px solid #1e1e30", borderRadius: 12, padding: 16 };
const boxTitleStyle: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: "#666", fontWeight: 600, marginBottom: 12 };
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1a2a", fontSize: 13, gap: 8 };
