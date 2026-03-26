"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ServiceRequest {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Doctor {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  specialty?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

const REQUEST_TYPES = [
  { value: "APPOINTMENT", label: "Appointment", icon: "📅", desc: "Schedule with a doctor" },
  { value: "FOLLOWUP", label: "Follow-up", icon: "🔄", desc: "Follow up on existing care" },
  { value: "MEDICATION_CHANGE", label: "Medication", icon: "💊", desc: "Change or refill prescription" },
  { value: "OTHER", label: "Other", icon: "📋", desc: "Any other request" },
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return { value: `${String(hour).padStart(2, "0")}:${min}`, label: `${h12}:${min} ${ampm}` };
});

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  DONE: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DONE: "Completed",
};

function parseDescription(desc: string) {
  const lines: Record<string, string> = {};
  desc.split("\n").forEach(line => {
    const [k, ...v] = line.split(": ");
    if (k && v.length) lines[k.trim()] = v.join(": ").trim();
  });
  return lines;
}

export default function RequestsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "CLIENT";
  const canSubmit = userRole === "CLIENT" || userRole === "MANAGER" || userRole === "ADMIN";

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [type, setType] = useState("APPOINTMENT");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");

  // Provider — existing or new
  const [providerMode, setProviderMode] = useState<"existing" | "new">("existing");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderPhone, setNewProviderPhone] = useState("");
  const [newProviderAddress, setNewProviderAddress] = useState("");

  const needsDoctor = type === "APPOINTMENT" || type === "FOLLOWUP";
  const needsPharmacy = type === "MEDICATION_CHANGE";

  useEffect(() => {
    Promise.all([
      fetch("/api/service-requests").then(r => r.json()),
      fetch("/api/doctors").then(r => r.json()),
      fetch("/api/pharmacies").then(r => r.json()),
    ]).then(([reqData, docData, pharmData]) => {
      setRequests(reqData.items || []);
      setDoctors(docData.items || docData || []);
      setPharmacies(pharmData.items || pharmData || []);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Build structured description Lily can read
    const lines: string[] = [];

    if (preferredDate) {
      const dateStr = new Date(preferredDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      lines.push(`DATE: ${dateStr}${preferredTime ? ` at ${timeOptions.find(t => t.value === preferredTime)?.label || preferredTime}` : ""}`);
    }

    if (needsDoctor) {
      if (providerMode === "existing" && selectedDoctorId) {
        const doc = doctors.find(d => d.id === selectedDoctorId);
        if (doc) {
          lines.push(`DOCTOR: ${doc.name}${doc.specialty ? ` (${doc.specialty})` : ""}`);
          if (doc.phone) lines.push(`DOCTOR PHONE: ${doc.phone}`);
          if (doc.address) lines.push(`DOCTOR ADDRESS: ${doc.address}`);
        }
      } else if (providerMode === "new" && newProviderName) {
        lines.push(`DOCTOR: ${newProviderName}`);
        if (newProviderPhone) lines.push(`DOCTOR PHONE: ${newProviderPhone}`);
        if (newProviderAddress) lines.push(`DOCTOR ADDRESS: ${newProviderAddress}`);
      }
    }

    if (needsPharmacy) {
      if (providerMode === "existing" && selectedPharmacyId) {
        const ph = pharmacies.find(p => p.id === selectedPharmacyId);
        if (ph) {
          lines.push(`PHARMACY: ${ph.name}`);
          if (ph.phone) lines.push(`PHARMACY PHONE: ${ph.phone}`);
          if (ph.address) lines.push(`PHARMACY ADDRESS: ${ph.address}`);
        }
      } else if (providerMode === "new" && newProviderName) {
        lines.push(`PHARMACY: ${newProviderName}`);
        if (newProviderPhone) lines.push(`PHARMACY PHONE: ${newProviderPhone}`);
        if (newProviderAddress) lines.push(`PHARMACY ADDRESS: ${newProviderAddress}`);
      }
    }

    if (notes) lines.push(`NOTES: ${notes}`);

    const description = lines.join("\n");

    await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description }),
    });

    // Reset
    setPreferredDate(""); setPreferredTime(""); setNotes("");
    setSelectedDoctorId(""); setSelectedPharmacyId("");
    setNewProviderName(""); setNewProviderPhone(""); setNewProviderAddress("");
    setProviderMode("existing");
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);

    fetch("/api/service-requests").then(r => r.json()).then(d => setRequests(d.items || []));
  }

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal";

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const existingProviders = needsDoctor ? doctors : needsPharmacy ? pharmacies : [];
  const selectedExisting = needsDoctor
    ? doctors.find(d => d.id === selectedDoctorId)
    : pharmacies.find(p => p.id === selectedPharmacyId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-6">Service Requests</h1>

      {!canSubmit && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-4 text-sm text-gray-500">
          Only the account owner or a Manager can submit service requests.
        </div>
      )}

      {canSubmit && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-5">
          <h2 className="text-base font-bold text-navy">New Request</h2>

          {/* Request type — card selector */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">What do you need?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REQUEST_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => { setType(t.value); setProviderMode("existing"); setSelectedDoctorId(""); setSelectedPharmacyId(""); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-colors ${type === t.value ? "border-teal bg-teal/5" : "border-gray-200 hover:border-teal/40"}`}>
                  <span className="text-xl">{t.icon}</span>
                  <span className={`text-xs font-semibold ${type === t.value ? "text-teal" : "text-navy"}`}>{t.label}</span>
                  <span className="text-xs text-gray-400 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Preferred Date & Time</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <input type="date" className={inputClass} value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} />
                <p className="text-xs text-gray-400 mt-1">Preferred date</p>
              </div>
              <div>
                <select className={inputClass} value={preferredTime} onChange={e => setPreferredTime(e.target.value)}>
                  <option value="">Any time</option>
                  {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Preferred time</p>
              </div>
            </div>
          </div>

          {/* Provider section — only for appointment/followup/medication */}
          {(needsDoctor || needsPharmacy) && (
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                {needsDoctor ? "Doctor / Provider" : "Pharmacy"}
              </label>

              {existingProviders.length > 0 && (
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setProviderMode("existing")}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${providerMode === "existing" ? "bg-teal text-white border-teal" : "border-gray-300 text-gray-600 hover:border-teal"}`}>
                    From my profile
                  </button>
                  <button type="button" onClick={() => setProviderMode("new")}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${providerMode === "new" ? "bg-teal text-white border-teal" : "border-gray-300 text-gray-600 hover:border-teal"}`}>
                    + New provider
                  </button>
                </div>
              )}

              {(providerMode === "existing" && existingProviders.length > 0) ? (
                <div className="space-y-2">
                  {existingProviders.map((p: any) => (
                    <label key={p.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      (needsDoctor ? selectedDoctorId : selectedPharmacyId) === p.id
                        ? "border-teal bg-teal/5" : "border-gray-200 hover:border-teal/40"}`}>
                      <input type="radio" name="provider" value={p.id} className="mt-0.5 accent-teal"
                        checked={(needsDoctor ? selectedDoctorId : selectedPharmacyId) === p.id}
                        onChange={() => needsDoctor ? setSelectedDoctorId(p.id) : setSelectedPharmacyId(p.id)} />
                      <div>
                        <div className="text-sm font-semibold text-navy">{p.name}{p.specialty ? ` · ${p.specialty}` : ""}</div>
                        {p.phone && <div className="text-xs text-gray-500">{p.phone}</div>}
                        {p.address && <div className="text-xs text-gray-400">{p.address}</div>}
                      </div>
                    </label>
                  ))}
                  <button type="button" onClick={() => setProviderMode("new")}
                    className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-teal hover:text-teal rounded-xl py-2.5 text-sm transition-colors">
                    + Use a different {needsDoctor ? "doctor" : "pharmacy"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Provider Details</p>
                  <input className={inputClass} placeholder={needsDoctor ? "Doctor / clinic name *" : "Pharmacy name *"}
                    value={newProviderName} onChange={e => setNewProviderName(e.target.value)} required={providerMode === "new"} />
                  <input type="tel" className={inputClass} placeholder="Phone number"
                    value={newProviderPhone} onChange={e => setNewProviderPhone(e.target.value)} />
                  <input className={inputClass} placeholder="Address"
                    value={newProviderAddress} onChange={e => setNewProviderAddress(e.target.value)} />
                  <p className="text-xs text-teal">Lily will use this info to contact them on your behalf.</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea className={inputClass + " resize-none"} rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={type === "APPOINTMENT" ? "Reason for visit, symptoms, special instructions..." :
                type === "MEDICATION_CHANGE" ? "Which medication, what change is needed..." :
                type === "FOLLOWUP" ? "What to follow up on..." : "Describe what you need..."} />
          </div>

          {success && (
            <div className="bg-teal/10 text-teal text-sm rounded-xl px-4 py-3 font-medium">✓ Request submitted! Lily will take care of this.</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
            {submitting ? "Submitting…" : "Submit Request →"}
          </button>
        </form>
      )}

      {/* Past requests */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-navy mb-4">Your Requests</h2>
        {requests.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 font-medium">No requests yet.</p>
            <p className="text-xs text-gray-400 mt-1">Submit a request and Lily will handle it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const parsed = parseDescription(req.description || "");
              const typeInfo = REQUEST_TYPES.find(t => t.value === req.type);
              return (
                <div key={req.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{typeInfo?.icon}</span>
                      <span className="text-sm font-semibold text-navy">{typeInfo?.label || req.type}</span>
                      <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[req.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {parsed["DATE"] && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Date:</span><span className="font-medium text-navy">{parsed["DATE"]}</span></div>}
                    {(parsed["DOCTOR"] || parsed["PHARMACY"]) && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">{parsed["DOCTOR"] ? "Doctor:" : "Pharmacy:"}</span><span className="font-medium text-navy">{parsed["DOCTOR"] || parsed["PHARMACY"]}</span></div>}
                    {(parsed["DOCTOR PHONE"] || parsed["PHARMACY PHONE"]) && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Phone:</span><span>{parsed["DOCTOR PHONE"] || parsed["PHARMACY PHONE"]}</span></div>}
                    {parsed["NOTES"] && <div className="flex gap-2"><span className="text-gray-400 w-20 flex-shrink-0">Notes:</span><span>{parsed["NOTES"]}</span></div>}
                    {!Object.keys(parsed).length && req.description && <p>{req.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
