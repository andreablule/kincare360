"use client";

import { useEffect, useState } from "react";
import PatientSwitcher from "@/components/PatientSwitcher";
import { usePatientContext } from "@/components/PatientContext";

interface AppointmentNote {
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
  PENDING: "Family follow-up",
  IN_PROGRESS: "Family follow-up",
  COMPLETED: "Saved",
  DONE: "Saved",
};

const typeIcons: Record<string, string> = {
  APPOINTMENT: "📅",
  FOLLOWUP: "🔄",
  MEDICATION_CHANGE: "📝",
  OTHER: "📋",
};

const typeLabels: Record<string, string> = {
  APPOINTMENT: "Appointment Note",
  FOLLOWUP: "Follow-up Note",
  MEDICATION_CHANGE: "Routine Note",
  OTHER: "Coordination Note",
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
  const [appointmentNotes, setAppointmentNotes] = useState<AppointmentNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = patientQuery ? `?${patientQuery}` : "";
    fetch(`/api/service-requests${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setAppointmentNotes(data.items || []);
        setLoading(false);
      });
  }, [selectedPatientId, patientQuery]);

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;

  const active = appointmentNotes.filter(a => a.status === "IN_PROGRESS" || a.status === "PENDING");
  const saved = appointmentNotes.filter(a => a.status === "COMPLETED" || a.status === "DONE");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-2">Appointments &amp; Family Follow-Up</h1>
      <PatientSwitcher />
      <p className="text-sm text-gray-500 mb-4">
        Use this page to view appointment-related notes and family follow-up items. KinCare360 helps keep details organized for family coordination, but does not provide medical advice, schedule or cancel appointments as a healthcare provider, or guarantee provider communication.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 text-sm text-amber-800">
        Families remain responsible for confirming appointments, medication questions, referrals, refills, tests, and care decisions directly with qualified providers.
      </div>

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Family Follow-Up
          </h2>
          <div className="space-y-3">
            {active.map((appt) => {
              const parsed = parseDescription(appt.description);
              return (
                <div key={appt.id} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcons[appt.type] || "📋"}</span>
                      <span className="text-sm font-bold text-navy">{typeLabels[appt.type] || "Coordination Note"}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[appt.status]}`}>
                      {statusLabels[appt.status] || "Family follow-up"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {parsed["DOCTOR"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Provider</span>
                        <span className="font-semibold text-navy">{parsed["DOCTOR"]}</span>
                      </div>
                    )}
                    {parsed["PHARMACY"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Pharmacy</span>
                        <span className="font-semibold text-navy">{parsed["PHARMACY"]}</span>
                      </div>
                    )}
                    {parsed["DATE"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Requested</span>
                        <span className="text-navy">{parsed["DATE"]}</span>
                      </div>
                    )}
                    {parsed["NOTES"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Note</span>
                        <span className="text-gray-600">{parsed["NOTES"]}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    Saved as a family coordination note. Please confirm details directly with the provider when needed.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Saved Notes
          </h2>
          <div className="space-y-3">
            {saved.map((appt) => {
              const parsed = parseDescription(appt.description);
              return (
                <div key={appt.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcons[appt.type] || "📋"}</span>
                      <span className="text-sm font-bold text-navy">{typeLabels[appt.type] || "Coordination Note"}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                      ✓ Saved
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {parsed["DOCTOR"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Provider</span>
                        <span className="font-semibold text-navy">{parsed["DOCTOR"]}</span>
                      </div>
                    )}
                    {parsed["DATE"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Date</span>
                        <span className="text-navy">{parsed["DATE"]}</span>
                      </div>
                    )}
                    {parsed["NOTES"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-20">Note</span>
                        <span className="text-gray-600">{parsed["NOTES"]}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Saved on {formatDate(appt.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {appointmentNotes.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="text-lg font-bold text-navy mb-2">No appointment notes yet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Appointment details and family follow-up notes can appear here when shared. Families should schedule, cancel, and confirm appointments directly with providers.
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 mt-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Important limits</h3>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">•</span>
            KinCare360 is for non-medical family coordination and routine reminders.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">•</span>
            We do not provide medical advice, clinical assessment, appointment guarantees, or provider-side case management.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">•</span>
            Contact providers directly for appointment changes, prescriptions, tests, referrals, or clinical questions.
          </li>
        </ul>
      </div>
    </div>
  );
}
