"use client";

import { useEffect, useState } from "react";
import PatientSwitcher from "@/components/PatientSwitcher";
import { usePatientContext } from "@/components/PatientContext";

interface Appointment {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  DONE: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "Lily is scheduling",
  COMPLETED: "Confirmed",
  DONE: "Confirmed",
};

const typeIcons: Record<string, string> = {
  APPOINTMENT: "📅",
  FOLLOWUP: "🔄",
  MEDICATION_CHANGE: "💊",
  OTHER: "📋",
};

const typeLabels: Record<string, string> = {
  APPOINTMENT: "Appointment",
  FOLLOWUP: "Follow-up",
  MEDICATION_CHANGE: "Prescription",
  OTHER: "Other",
};

function parseDescription(desc: string) {
  const lines: Record<string, string> = {};
  (desc || "").split("\n").forEach(line => {
    const [k, ...v] = line.split(": ");
    if (k && v.length) lines[k.trim()] = v.join(": ").trim();
  });
  return lines;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const { selectedPatientId, patientQuery } = usePatientContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = patientQuery ? `?${patientQuery}` : "";
    fetch(`/api/service-requests${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data.items || []);
        setLoading(false);
      });
  }, [selectedPatientId, patientQuery]);

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;

  // Split into upcoming (IN_PROGRESS, PENDING) and past (COMPLETED, DONE)
  const active = appointments.filter(a => a.status === "IN_PROGRESS" || a.status === "PENDING");
  const confirmed = appointments.filter(a => a.status === "COMPLETED" || a.status === "DONE");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-2">Appointments</h1>
      <PatientSwitcher />
      <p className="text-sm text-gray-500 mb-6">
        All appointments are scheduled by Lily through phone calls. Just call <a href="tel:+18125155252" className="text-teal font-medium">(812) 515-5252</a> and ask Lily to schedule, reschedule, or cancel any appointment.
      </p>

      {/* Active / In Progress */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            In Progress
          </h2>
          <div className="space-y-3">
            {active.map((appt) => {
              const parsed = parseDescription(appt.description);
              return (
                <div key={appt.id} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcons[appt.type] || "📋"}</span>
                      <span className="text-sm font-bold text-navy">{typeLabels[appt.type] || appt.type}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[appt.status]}`}>
                      {statusLabels[appt.status] || appt.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {parsed["DOCTOR"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Doctor</span>
                        <span className="font-semibold text-navy">{parsed["DOCTOR"]}</span>
                      </div>
                    )}
                    {parsed["PHARMACY"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Pharmacy</span>
                        <span className="font-semibold text-navy">{parsed["PHARMACY"]}</span>
                      </div>
                    )}
                    {parsed["DATE"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Requested</span>
                        <span className="text-navy">{parsed["DATE"]}</span>
                      </div>
                    )}
                    {parsed["NOTES"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Reason</span>
                        <span className="text-gray-600">{parsed["NOTES"]}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    Lily is handling this. You'll receive a call back with confirmation.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmed appointments */}
      {confirmed.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Confirmed Appointments
          </h2>
          <div className="space-y-3">
            {confirmed.map((appt) => {
              const parsed = parseDescription(appt.description);
              return (
                <div key={appt.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcons[appt.type] || "📋"}</span>
                      <span className="text-sm font-bold text-navy">{typeLabels[appt.type] || appt.type}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                      ✓ Confirmed
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {parsed["DOCTOR"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Doctor</span>
                        <span className="font-semibold text-navy">{parsed["DOCTOR"]}</span>
                      </div>
                    )}
                    {parsed["DATE"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Date</span>
                        <span className="text-navy">{parsed["DATE"]}</span>
                      </div>
                    )}
                    {parsed["NOTES"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-16">Reason</span>
                        <span className="text-gray-600">{parsed["NOTES"]}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Scheduled on {formatDate(appt.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="text-lg font-bold text-navy mb-2">No appointments yet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Call Lily to schedule your first appointment. She'll handle everything — finding a doctor, calling the office, and confirming the details.
          </p>
          <a href="tel:+18125155252" className="inline-flex items-center gap-2 bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Lily: (812) 515-5252
          </a>
        </div>
      )}

      {/* Help text */}
      <div className="bg-gray-50 rounded-xl p-4 mt-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">How it works</h3>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">1.</span>
            Call Lily and tell her what you need — an appointment, refill, or test
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">2.</span>
            Lily calls the doctor's office or pharmacy on your behalf
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">3.</span>
            Lily calls you back with the confirmed appointment details
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">4.</span>
            Need to reschedule? Just call Lily again
          </li>
        </ul>
      </div>
    </div>
  );
}
