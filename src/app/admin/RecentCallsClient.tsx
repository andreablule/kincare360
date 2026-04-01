"use client";

import { useState } from "react";

interface CallLog {
  id: string;
  callDate: string | Date;
  summary?: string | null;
  mood?: string | null;
  callType?: string | null;
  urgent: boolean;
  transcript?: string | null;
  patient: { firstName: string; lastName: string; phone?: string | null };
}

interface RecentCallsClientProps {
  calls: CallLog[];
}

export default function RecentCallsClient({ calls }: RecentCallsClientProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {calls.map((log) => {
        const moodColor =
          log.mood === "happy"
            ? "bg-green-100 text-green-700"
            : log.mood === "sad" || log.mood === "concerned"
            ? "bg-red-100 text-red-700"
            : log.mood
            ? "bg-gray-100 text-gray-600"
            : null;

        const isOpen = expanded.has(log.id);
        const callDate = new Date(log.callDate);

        return (
          <div
            key={log.id}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:border-teal/30 transition-colors cursor-pointer"
            onClick={() => toggle(log.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#0f172a]">
                  {log.patient.firstName} {log.patient.lastName}
                </span>
                {log.patient.phone && (
                  <span className="text-xs font-mono text-gray-400">{log.patient.phone}</span>
                )}
                {log.callType && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {log.callType}
                  </span>
                )}
                {log.urgent && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    ⚠ Urgent
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {log.summary && (
                  <span className="text-xs text-teal font-medium select-none">
                    {isOpen ? "Hide ▲" : "Show ▼"}
                  </span>
                )}
              </div>
            </div>

            {/* Summary + Transcript — collapsed by default */}
            {isOpen && log.summary && (
              <p className="text-sm text-gray-600 mb-2 leading-relaxed">{log.summary}</p>
            )}
            {isOpen && log.transcript && (
              <div className="max-h-48 overflow-y-auto bg-gray-50 border border-gray-100 rounded-lg p-3 mb-2">
                <p className="text-xs font-mono text-gray-500 whitespace-pre-wrap leading-relaxed">{log.transcript}</p>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>
                {callDate.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })}{" "}
                {callDate.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })}
              </span>
              {moodColor && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${moodColor}`}>
                  {log.mood}
                </span>
              )}
              {log.summary && !isOpen && (
                <span className="text-gray-300 italic truncate max-w-xs">
                  {log.summary.slice(0, 60)}…
                </span>
              )}
            </div>
          </div>
        );
      })}
      {calls.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400">
          No call logs yet.
        </div>
      )}
    </div>
  );
}
