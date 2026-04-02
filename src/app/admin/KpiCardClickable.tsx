"use client";

import { useState } from "react";

interface KpiCardClickableProps {
  title: string;
  value: string | number;
  description: string;
  children: React.ReactNode;
}

export default function KpiCardClickable({ title, value, description, children }: KpiCardClickableProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer group"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(true); }}
        aria-label={`View details for ${title}`}
      >
        <div className="transition-transform group-hover:scale-[1.02] group-hover:shadow-md">
          {children}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(15,23,42,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-4xl font-bold text-[#0f172a]">{typeof value === "number" ? value.toLocaleString() : value}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-4 mt-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-4" />

            {/* Data source */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#14b8a6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data Source
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full bg-[#0f172a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1e293b] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
