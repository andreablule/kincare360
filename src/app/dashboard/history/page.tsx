"use client";

import { useEffect, useState } from "react";

interface CallLog {
  id: string;
  callDate: string;
  summary: string;
  mood: string;
  medicationsTaken: boolean;
  concerns: string;
  urgent: boolean;
  transcript: string | null;
  callType: string | null;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/call-logs")
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : data.items || []);
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter((log) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      log.summary?.toLowerCase().includes(q) ||
      log.mood?.toLowerCase().includes(q) ||
      log.concerns?.toLowerCase().includes(q) ||
      log.callType?.toLowerCase().includes(q) ||
      new Date(log.callDate).toLocaleDateString().includes(q)
    );
  });

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Call History</h1>

      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search calls by date, mood, type, or keywords..."
          className="w-full max-w-md border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400">
            {logs.length === 0 ? "No call logs yet. Lily will begin check-ins soon." : "No matching calls found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className={`bg-white rounded-2xl border ${log.urgent ? "border-red-300 bg-red-50/30" : "border-gray-100"} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-navy">
                    {new Date(log.callDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {log.urgent && (
                    <span className="text-xs bg-red-500 text-white font-bold px-2.5 py-0.5 rounded-full">
                      URGENT
                    </span>
                  )}
                  {log.callType && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                      {log.callType}
                    </span>
                  )}
                </div>
                {log.mood && (
                  <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                    Mood: {log.mood}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Medications:</span>
                  <span className={`font-medium ${log.medicationsTaken ? "text-teal" : "text-red-500"}`}>
                    {log.medicationsTaken ? "Taken" : "Not taken"}
                  </span>
                </div>

                {log.summary && (
                  <div>
                    <span className="text-gray-500">Summary:</span>
                    <p className="text-navy mt-0.5">{log.summary}</p>
                  </div>
                )}

                {log.concerns && (
                  <div>
                    <span className="text-gray-500">Concerns:</span>
                    <p className={`mt-0.5 ${log.urgent ? "text-red-600 font-medium" : "text-navy"}`}>{log.concerns}</p>
                  </div>
                )}

                {log.transcript && (
                  <details className="mt-2 border border-gray-100 rounded-xl">
                    <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-teal hover:bg-teal/5 rounded-xl">
                      View Transcript
                    </summary>
                    <div className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 max-h-64 overflow-y-auto">
                      {log.transcript}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
