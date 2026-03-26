"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    preferredCallTime: "",
    medicationReminderTime: "",
    checkInDays: "",
    preferredLanguage: "English",
  });

  useEffect(() => {
    fetch("/api/patient")
      .then((r) => r.json())
      .then((data) => {
        if (data.patient) {
          setForm({
            firstName: data.patient.firstName || "",
            lastName: data.patient.lastName || "",
            dob: data.patient.dob || "",
            phone: data.patient.phone || "",
            address: data.patient.address || "",
            city: data.patient.city || "",
            state: data.patient.state || "",
            zip: data.patient.zip || "",
            preferredCallTime: data.patient.preferredCallTime || "",
            medicationReminderTime: data.patient.medicationReminderTime || "",
            checkInDays: data.patient.checkInDays || "",
            preferredLanguage: data.patient.preferredLanguage || "English",
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    await fetch("/api/patient", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm";

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Patient Profile</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 max-w-2xl">
        {success && (
          <div className="bg-teal/10 text-teal text-sm rounded-xl px-4 py-3 font-medium">Profile updated successfully!</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">First Name</label>
            <input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Last Name</label>
            <input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Date of Birth</label>
            <input type="date" className={inputClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Phone</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">Address</label>
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">City</label>
            <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">State</label>
            <input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">ZIP</label>
            <input className={inputClass} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Preferred Call Time</label>
            <input type="time" className={inputClass} value={form.preferredCallTime} onChange={(e) => setForm({ ...form, preferredCallTime: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">When should Lily call for the daily check-in?</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Medication Reminder Time</label>
            <input type="time" className={inputClass} value={form.medicationReminderTime} onChange={(e) => setForm({ ...form, medicationReminderTime: e.target.value })} step="60" />
            <p className="text-xs text-gray-400 mt-1">When should Lily remind about medications? (e.g. 8:00 AM)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">Check-In Days</label>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
              const days = form.checkInDays ? form.checkInDays.split(",") : [];
              const active = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const updated = active ? days.filter((d) => d !== day) : [...days, day];
                    setForm({ ...form, checkInDays: updated.join(",") });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    active ? "bg-teal text-white border-teal" : "bg-white text-gray-600 border-gray-300 hover:border-teal"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Which days should Lily check in?</p>
        </div>

        {/* Preferred Language removed — English only for now */}

        <button type="submit" disabled={saving} className="bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
