"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface TranscriptMessage {
  role: "assistant" | "user";
  content: string;
}

interface VapiCall {
  id: string;
  createdAt: string;
  type: string;
  status: string;
  duration: number | null;
  customerNumber: string | null;
  endedReason: string | null;
  cost: number | null;
  transcript: TranscriptMessage[];
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatPhone(number: string | null): string {
  if (!number) return "Unknown";
  const digits = number.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return number;
}

function isUrgent(call: VapiCall): boolean {
  const text = call.transcript.map((m) => m.content).join(" ").toLowerCase();
  const urgentKeywords = ["emergency", "urgent", "fell", "fall", "hospital", "ambulance", "chest pain", "can't breathe", "bleeding", "911", "help me"];
  return urgentKeywords.some((kw) => text.includes(kw));
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ended": return "bg-green-100 text-green-700";
    case "ringing": case "queued": return "bg-yellow-100 text-yellow-700";
    case "in-progress": return "bg-blue-100 text-blue-700";
    case "failed": case "no-answer": case "busy": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function getTypeBadge(type: string): { bg: string; label: string } {
  if (type === "inboundPhoneCall" || type === "inbound") {
    return { bg: "bg-blue-100 text-blue-700", label: "Inbound" };
  }
  if (type === "outboundPhoneCall" || type === "outbound") {
    return { bg: "bg-purple-100 text-purple-700", label: "Outbound" };
  }
  return { bg: "bg-gray-100 text-gray-600", label: type };
}

function resolveCallerName(call: VapiCall, patientMap: Record<string, string>): string | null {
  if (!call.customerNumber) return null;
  const digits = call.customerNumber.replace(/\D/g, "").slice(-10);
  return patientMap[digits] || null;
}

export default function CallFeedClient({
  calls,
  patientMap,
}: {
  calls: VapiCall[];
  patientMap: Record<string, string>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      {/* Title bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-3">
            <svg className="w-7 h-7 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            VAPI Live Call Feed
          </h1>
          <p className="text-gray-500 text-sm mt-1">Last 20 calls to Lily — click a row to view transcript</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-medium rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isPending ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-[#0f172a]">{calls.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Calls</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {calls.filter((c) => c.type === "inboundPhoneCall" || c.type === "inbound").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Inbound</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {calls.filter((c) => c.type === "outboundPhoneCall" || c.type === "outbound").length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Outbound</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {calls.filter((c) => isUrgent(c)).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Urgent</div>
        </div>
      </div>

      {/* Call list */}
      {calls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <p className="text-gray-500 font-medium">No calls found</p>
          <p className="text-gray-400 text-sm mt-1">Calls to Lily will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => {
            const urgent = isUrgent(call);
            const expanded = expandedId === call.id;
            const typeBadge = getTypeBadge(call.type);
            const patientName = resolveCallerName(call, patientMap);
            const dt = new Date(call.createdAt);

            return (
              <div
                key={call.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${
                  urgent ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"
                }`}
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(expanded ? null : call.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors rounded-2xl"
                >
                  {/* Urgent indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgent ? "bg-red-500" : "bg-green-500"}`} />

                  {/* Date/time */}
                  <div className="min-w-[130px]">
                    <div className="text-sm font-medium text-[#0f172a]">
                      {dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </div>
                  </div>

                  {/* Caller */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0f172a] truncate">
                      {patientName || "Unknown Caller"}
                    </div>
                    <div className="text-xs text-gray-400">{formatPhone(call.customerNumber)}</div>
                  </div>

                  {/* Type badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${typeBadge.bg}`}>
                    {typeBadge.label}
                  </span>

                  {/* Duration */}
                  <div className="text-sm text-gray-600 min-w-[60px] text-right">{formatDuration(call.duration)}</div>

                  {/* Status */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getStatusColor(call.status)}`}>
                    {call.status}
                  </span>

                  {/* Cost */}
                  <div className="text-sm text-gray-500 min-w-[55px] text-right">
                    {call.cost != null ? `$${call.cost.toFixed(2)}` : "—"}
                  </div>

                  {/* Expand icon */}
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded transcript */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* Call details */}
                    <div className="flex flex-wrap gap-4 py-3 text-xs text-gray-500">
                      <span>ID: <span className="font-mono text-gray-400">{call.id.slice(0, 12)}...</span></span>
                      {call.endedReason && <span>Ended: <span className="font-medium text-gray-600">{call.endedReason}</span></span>}
                    </div>

                    {/* Transcript */}
                    {call.transcript.length > 0 ? (
                      <div className="space-y-3 mt-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transcript</h4>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                          {call.transcript.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                                  msg.role === "assistant"
                                    ? "bg-teal/10 text-[#0f172a] rounded-bl-md"
                                    : "bg-[#0f172a] text-white rounded-br-md"
                                }`}
                              >
                                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-60">
                                  {msg.role === "assistant" ? "Lily" : "Caller"}
                                </div>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic mt-2">No transcript available</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
