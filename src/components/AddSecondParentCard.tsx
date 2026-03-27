"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return { value: `${String(hour).padStart(2, "0")}:${min}`, label: `${h12}:${min} ${ampm}` };
});

export default function AddSecondParentCard() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    checkInTime: "09:00",
    medicationReminders: [{ time: "08:00" }] as { time: string }[],
    checkInDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    medications: "",
    conditions: "",
    primaryDoctor: "",
    doctorPhone: "",
  });

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm";

  async function handleSubmit() {
    setError("");
    if (!form.firstName || !form.lastName || !form.dob || !form.phone) {
      setError("First name, last name, date of birth, and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/patients/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add second parent.");
        setSaving(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  if (!showForm) {
    return (
      <div className="bg-teal/5 border-2 border-dashed border-teal/30 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-navy">Add Your Second Parent</h2>
          <p className="text-sm text-gray-500 mt-1">Your family plan covers 2 parents. Set up a profile for your second loved one.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal text-white px-6 py-2.5 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm whitespace-nowrap"
        >
          Add Second Parent →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold text-navy mb-4">Add Second Parent</h2>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      <div className="space-y-4 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">First Name *</label>
            <input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Last Name *</label>
            <input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Date of Birth *</label>
            <input type="date" className={inputClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Phone *</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(215) 555-0123" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">Gender</label>
          <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">Address</label>
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Home address" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-navy mb-1">City</label><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-navy mb-1">State</label><input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} /></div>
          <div><label className="block text-sm font-medium text-navy mb-1">ZIP</label><input className={inputClass} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></div>
        </div>

        {/* Call preferences */}
        <div className="border border-teal/20 rounded-xl p-4 space-y-4 bg-teal/5">
          <h3 className="text-sm font-semibold text-navy">Call Preferences</h3>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Daily Check-In Time</label>
            <select className={inputClass} value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}>
              {timeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Medication Reminder Times</label>
            {form.medicationReminders.map((r, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select className={inputClass} value={r.time} onChange={(e) => {
                  const updated = [...form.medicationReminders];
                  updated[i] = { time: e.target.value };
                  setForm({ ...form, medicationReminders: updated });
                }}>
                  {timeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.medicationReminders.length > 1 && (
                  <button type="button" onClick={() => setForm({ ...form, medicationReminders: form.medicationReminders.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 text-sm font-bold px-2">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, medicationReminders: [...form.medicationReminders, { time: "08:00" }] })} className="text-teal text-sm font-medium hover:underline mt-1">
              + Add another reminder
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Preferred Days</label>
            <div className="flex flex-wrap gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <button key={day} type="button"
                  onClick={() => setForm({ ...form, checkInDays: form.checkInDays.includes(day) ? form.checkInDays.filter((d) => d !== day) : [...form.checkInDays, day] })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.checkInDays.includes(day) ? "bg-teal text-white border-teal" : "bg-white text-gray-600 border-gray-300 hover:border-teal"}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Medical basics */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Current Medications</label>
          <textarea className={inputClass + " resize-none"} rows={2} value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} placeholder="List medications (e.g. Metformin 500mg, Lisinopril 10mg)" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Medical Conditions</label>
          <textarea className={inputClass + " resize-none"} rows={2} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="e.g. Type 2 Diabetes, Hypertension" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Primary Doctor</label>
            <input className={inputClass} value={form.primaryDoctor} onChange={(e) => setForm({ ...form, primaryDoctor: e.target.value })} placeholder="Doctor's name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Doctor Phone</label>
            <input type="tel" className={inputClass} value={form.doctorPhone} onChange={(e) => setForm({ ...form, doctorPhone: e.target.value })} placeholder="Doctor's phone" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
            {saving ? "Saving..." : "Save Second Parent"}
          </button>
        </div>
      </div>
    </div>
  );
}
