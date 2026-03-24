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
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/call-logs")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.items || []);
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
          placeholder="Search calls by date, mood, or keywords..."
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
            <div key={log.id} className={`bg-white rounded-2xl border ${log.urgent ? "border-red-200" : "border-gray-100"} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-navy">
                    {new Date(log.callDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {log.urgent && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                      Urgent
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
                    <p className="text-navy mt-0.5">{log.concerns}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
