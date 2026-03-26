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
  servicesRequested: string | null;
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
          {logs.length === 0 ? (
            <>
              <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No call history yet.</p>
              <p className="text-gray-400 text-sm mt-1">Lily will log every check-in and medication reminder here.</p>
            </>
          ) : (
            <p className="text-gray-400">No matching calls found.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className={`rounded-2xl border p-5 ${log.urgent ? "border-red-300 bg-red-50" : "bg-white border-gray-100"}`}>
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

                {log.servicesRequested && (() => {
                  try {
                    const svc = JSON.parse(log.servicesRequested);
                    return (
                      <div className="mt-2 bg-teal/5 border border-teal/20 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-teal">Lily found a service</span>
                        </div>
                        {svc.service && <p className="text-sm text-navy"><span className="text-gray-500">Requested:</span> {svc.service}</p>}
                        {svc.providers?.length > 0 && (
                          <div className="mt-1">
                            <span className="text-sm text-gray-500">Contacted:</span>
                            <ul className="mt-0.5 space-y-0.5">
                              {svc.providers.map((p: string, i: number) => (
                                <li key={i} className="text-sm text-navy">• {p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {svc.outcome && <p className="text-sm text-gray-500 mt-1">Outcome: {svc.outcome}</p>}
                      </div>
                    );
                  } catch { return null; }
                })()}

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
