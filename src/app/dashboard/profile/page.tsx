"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import PatientSwitcher from "@/components/PatientSwitcher";
import { usePatientContext } from "@/components/PatientContext";

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return { value: `${String(hour).padStart(2, "0")}:${min}`, label: `${h12}:${min} ${ampm}` };
});

export default function ProfilePage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "CLIENT";
  const isOwner = userRole === "CLIENT" || userRole === "ADMIN";
  const canEditProfile = userRole === "CLIENT" || userRole === "MANAGER" || userRole === "ADMIN";
  const { selectedPatientId, patientQuery } = usePatientContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
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
    gender: "",
  });
  const [medTimes, setMedTimes] = useState<string[]>([""]);

  useEffect(() => {
    const url = patientQuery ? `/api/patient?${patientQuery}` : "/api/patient";
    fetch(url)
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
            gender: data.patient.gender || "",
          });
          // Split comma-separated med times into array
          const times = data.patient.medicationReminderTime
            ? data.patient.medicationReminderTime.split(',').map((t: string) => t.trim()).filter(Boolean)
            : [""];
          setMedTimes(times);
        }
        setLoading(false);
      });
  }, [selectedPatientId, patientQuery]);

  async function handleDelete() {
    if (isOwner && deleteConfirm !== "DELETE") return;
    setDeleting(true);
    await fetch("/api/users/me", { method: "DELETE" });
    setDeleting(false);
    signOut({ callbackUrl: "/" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const payload = {
      ...form,
      preferredCallTime: form.preferredCallTime === "NONE" ? "" : form.preferredCallTime,
      medicationReminderTime: medTimes[0] === "NONE" ? "" : medTimes.filter(Boolean).join(','),
      gender: form.gender || null,
    };
    const patchUrl = patientQuery ? `/api/patient?${patientQuery}` : "/api/patient";
    await fetch(patchUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      <PatientSwitcher />

      {!canEditProfile && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-4 text-sm text-gray-500 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Read-only view. Only the account owner or a Manager can edit the patient profile.
        </div>
      )}

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
          <label className="block text-sm font-medium text-navy mb-1">Gender</label>
          <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Helps Lily address your loved one naturally</p>
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
            <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.preferredCallTime === "NONE"} onChange={e => setForm({ ...form, preferredCallTime: e.target.checked ? "NONE" : "" })} className="rounded border-gray-300 text-teal focus:ring-teal" />
              No check-in calls
            </label>
            {form.preferredCallTime !== "NONE" && (
              <select className={inputClass} value={form.preferredCallTime} onChange={(e) => setForm({ ...form, preferredCallTime: e.target.value })}>
                <option value="">Select a time</option>
                {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}
            <p className="text-xs text-gray-400 mt-1">When should Lily call for the daily check-in?</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Medication Reminder Times</label>
            <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={medTimes.length === 0 || (medTimes.length === 1 && medTimes[0] === "NONE")} onChange={e => {
                if (e.target.checked) {
                  setMedTimes(["NONE"]);
                } else {
                  setMedTimes([""]);
                }
              }} className="rounded border-gray-300 text-teal focus:ring-teal" />
              No medication reminders
            </label>
            {!(medTimes.length === 0 || (medTimes.length === 1 && medTimes[0] === "NONE")) && (
              <>
                {medTimes.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <select
                      className={inputClass}
                      value={t}
                      onChange={e => {
                        const updated = [...medTimes];
                        updated[i] = e.target.value;
                        setMedTimes(updated);
                      }}
                    >
                      <option value="">Select a time</option>
                      {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {medTimes.length > 1 && (
                      <button type="button" onClick={() => setMedTimes(medTimes.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 text-lg font-bold px-1 flex-shrink-0">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setMedTimes([...medTimes, ""])}
                  className="text-teal text-sm font-medium hover:underline mt-1">
                  + Add another reminder time
                </button>
              </>
            )}
            <p className="text-xs text-gray-400 mt-1">Lily will call at each time to remind about medications</p>
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

        {canEditProfile && (
          <button type="submit" disabled={saving} className="bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </form>

      {/* Delete section */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 max-w-2xl mt-6">
        <h2 className="text-base font-semibold text-navy mb-1">
          {isOwner ? "Delete Account" : "Remove My Access"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {isOwner
            ? "This will permanently delete your account, all patient data, and cancel your subscription. This cannot be undone."
            : "This will remove your access to this care dashboard. You can be re-invited by the account owner."}
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="border border-red-300 text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          {isOwner ? "Delete My Account" : "Remove My Access"}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-navy mb-2">
              {isOwner ? "Delete Account?" : "Remove Your Access?"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {isOwner
                ? "This will permanently delete all your data and cancel your KinCare360 subscription. There is no going back."
                : "You'll lose access to this dashboard. The account owner can re-invite you later."}
            </p>
            {isOwner && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-navy mb-1">Type <span className="font-bold text-red-500">DELETE</span> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="DELETE"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || (isOwner && deleteConfirm !== "DELETE")}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-red-600 disabled:opacity-40"
              >
                {deleting ? "Deleting..." : isOwner ? "Yes, Delete Everything" : "Remove My Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
