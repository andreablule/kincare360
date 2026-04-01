"use client";

import { useState, useTransition } from "react";

interface Prospect {
  id: string;
  phone: string;
  name?: string | null;
  callCount: number;
  lastCallAt: string | Date;
  status: string;
  summary?: string | null;
  mood?: string | null;
  concerns?: string | null;
}

interface ProspectsSectionProps {
  prospects: Prospect[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-yellow-100 text-yellow-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-gray-100 text-gray-500",
};

async function updateProspectStatus(id: string, status: string) {
  const res = await fetch("/api/prospects", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
}

export default function ProspectsSection({ prospects: initial }: ProspectsSectionProps) {
  const [prospects, setProspects] = useState(initial);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStatus(id: string, newStatus: string) {
    startTransition(async () => {
      try {
        await updateProspectStatus(id, newStatus);
        setProspects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } catch {
        alert("Failed to update status. Please try again.");
      }
    });
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[#0f172a]">Inbound Prospects</h2>
        <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          {prospects.length}
        </span>
        <span className="text-xs text-gray-400 ml-1">Callers who haven't signed up yet</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {prospects.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No prospects yet. Unknown callers will appear here.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Calls</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Call</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p, i) => {
                  const lastCall = new Date(p.lastCallAt);
                  const isOpen = expanded.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors ${
                        i % 2 === 1 ? "bg-gray-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-4 font-mono text-[#0f172a] font-semibold">{p.phone}</td>
                      <td className="px-4 py-4 text-gray-600">{p.name || <span className="text-gray-300 italic">Unknown</span>}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-[#0f172a] font-semibold">
                          📞 {p.callCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-sm">
                        {lastCall.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })}{" "}
                        {lastCall.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        {p.summary ? (
                          <button
                            onClick={() => toggleExpand(p.id)}
                            className="text-xs text-teal hover:underline text-left"
                          >
                            {isOpen ? (
                              <span>
                                {p.summary}
                                <span className="ml-1 text-gray-400">▲ hide</span>
                              </span>
                            ) : (
                              <span className="truncate block max-w-[160px]">
                                {p.summary.slice(0, 40)}… <span className="text-gray-400">▼ more</span>
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-300 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {p.status === "NEW" && (
                            <button
                              disabled={pending}
                              onClick={() => handleStatus(p.id, "CONTACTED")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors disabled:opacity-50"
                            >
                              Mark Contacted
                            </button>
                          )}
                          {p.status === "CONTACTED" && (
                            <button
                              disabled={pending}
                              onClick={() => handleStatus(p.id, "CONVERTED")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              Mark Converted
                            </button>
                          )}
                          {(p.status === "CONTACTED" || p.status === "CONVERTED") && (
                            <button
                              disabled={pending}
                              onClick={() => handleStatus(p.id, "LOST")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              Lost
                            </button>
                          )}
                          {p.status === "LOST" && (
                            <button
                              disabled={pending}
                              onClick={() => handleStatus(p.id, "NEW")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
