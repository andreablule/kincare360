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

type Doctor = { name: string; specialty: string; phone: string; address: string };
type PharmacyEntry = { name: string; phone: string; address: string };
type MedicationEntry = { name: string; dosage: string; frequency: string };
type ConditionEntry = { name: string };
type FamilyMemberEntry = { name: string; relationship: string; phone: string };
type InsuranceEntry = { company: string; memberId: string; groupNumber: string; policyHolder: string };

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
  });

  const [doctors, setDoctors] = useState<Doctor[]>([{ name: "", specialty: "", phone: "", address: "" }]);
  const [pharmacies, setPharmacies] = useState<PharmacyEntry[]>([{ name: "", phone: "", address: "" }]);
  const [medications, setMedications] = useState<MedicationEntry[]>([{ name: "", dosage: "", frequency: "" }]);
  const [conditions, setConditions] = useState<ConditionEntry[]>([{ name: "" }]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberEntry[]>([{ name: "", relationship: "", phone: "" }]);
  const [insurances, setInsurances] = useState<InsuranceEntry[]>([{ company: "", memberId: "", groupNumber: "", policyHolder: "" }]);

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm";
  const labelClass = "block text-sm font-medium text-navy mb-1";

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
        body: JSON.stringify({
          ...form,
          doctors: doctors.filter((d) => d.name),
          pharmacies: pharmacies.filter((p) => p.name),
          medications: medications.filter((m) => m.name),
          conditions: conditions.filter((c) => c.name),
          familyMembers: familyMembers.filter((f) => f.name),
          insurances: insurances.filter((ins) => ins.company),
        }),
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

  function updateArrayItem<T>(arr: T[], index: number, field: keyof T, value: string, setter: (v: T[]) => void) {
    setter(arr.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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
          Add Second Parent &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold text-navy mb-4">Add Second Parent</h2>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      <div className="space-y-5 max-w-2xl">
        {/* Basic Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name *</label>
            <input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
          </div>
          <div>
            <label className={labelClass}>Last Name *</label>
            <input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date of Birth *</label>
            <input type="date" className={inputClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(215) 555-0123" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Address</label>
          <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Home address" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={labelClass}>City</label><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className={labelClass}>State</label><input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} /></div>
          <div><label className={labelClass}>ZIP</label><input className={inputClass} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></div>
        </div>

        {/* Call Preferences */}
        <div className="border border-teal/20 rounded-xl p-4 space-y-4 bg-teal/5">
          <h3 className="text-sm font-semibold text-navy">Call Preferences</h3>
          <div>
            <label className={labelClass}>Preferred Check-In Time</label>
            <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.checkInTime === ""} onChange={e => setForm({ ...form, checkInTime: e.target.checked ? "" : "09:00" })} className="rounded border-gray-300 text-teal focus:ring-teal" />
              No check-in calls
            </label>
            {form.checkInTime !== "" && (
              <select className={inputClass} value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}>
                {timeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className={labelClass}>Medication Reminder Times</label>
            <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.medicationReminders.length === 0} onChange={e => {
                if (e.target.checked) {
                  setForm({ ...form, medicationReminders: [] });
                } else {
                  setForm({ ...form, medicationReminders: [{ time: "08:00" }] });
                }
              }} className="rounded border-gray-300 text-teal focus:ring-teal" />
              No medication reminders
            </label>
            {form.medicationReminders.length > 0 && (
              <>
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
                      <button type="button" onClick={() => setForm({ ...form, medicationReminders: form.medicationReminders.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 text-sm font-bold px-2">&times;</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, medicationReminders: [...form.medicationReminders, { time: "08:00" }] })} className="text-teal text-sm font-medium hover:underline mt-1">
                  + Add another reminder
                </button>
              </>
            )}
          </div>

          <div>
            <label className={labelClass}>Preferred Days</label>
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

        {/* Doctors */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Doctors</h3>
          {doctors.map((doc, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400">Doctor {i + 1}</span>
                {doctors.length > 1 && (
                  <button type="button" onClick={() => setDoctors(doctors.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={inputClass} value={doc.name} onChange={(e) => updateArrayItem(doctors, i, "name", e.target.value, setDoctors)} placeholder="Doctor's name" />
                <input className={inputClass} value={doc.specialty} onChange={(e) => updateArrayItem(doctors, i, "specialty", e.target.value, setDoctors)} placeholder="Specialty (e.g. Cardiology)" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="tel" className={inputClass} value={doc.phone} onChange={(e) => updateArrayItem(doctors, i, "phone", e.target.value, setDoctors)} placeholder="Phone" />
                <input className={inputClass} value={doc.address} onChange={(e) => updateArrayItem(doctors, i, "address", e.target.value, setDoctors)} placeholder="Office address" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setDoctors([...doctors, { name: "", specialty: "", phone: "", address: "" }])}
            className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-2.5 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
            + Add Another Doctor
          </button>
        </div>

        {/* Pharmacies */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Pharmacies</h3>
          {pharmacies.map((ph, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400">Pharmacy {i + 1}</span>
                {pharmacies.length > 1 && (
                  <button type="button" onClick={() => setPharmacies(pharmacies.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                )}
              </div>
              <input className={inputClass} value={ph.name} onChange={(e) => updateArrayItem(pharmacies, i, "name", e.target.value, setPharmacies)} placeholder="Pharmacy name" />
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="tel" className={inputClass} value={ph.phone} onChange={(e) => updateArrayItem(pharmacies, i, "phone", e.target.value, setPharmacies)} placeholder="Phone" />
                <input className={inputClass} value={ph.address} onChange={(e) => updateArrayItem(pharmacies, i, "address", e.target.value, setPharmacies)} placeholder="Address" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setPharmacies([...pharmacies, { name: "", phone: "", address: "" }])}
            className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-2.5 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
            + Add Another Pharmacy
          </button>
        </div>

        {/* Medications */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Medications</h3>
          {medications.map((med, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400">Medication {i + 1}</span>
                {medications.length > 1 && (
                  <button type="button" onClick={() => setMedications(medications.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input className={inputClass} value={med.name} onChange={(e) => updateArrayItem(medications, i, "name", e.target.value, setMedications)} placeholder="Medication name" />
                <input className={inputClass} value={med.dosage} onChange={(e) => updateArrayItem(medications, i, "dosage", e.target.value, setMedications)} placeholder="Dosage (e.g. 500mg)" />
                <input className={inputClass} value={med.frequency} onChange={(e) => updateArrayItem(medications, i, "frequency", e.target.value, setMedications)} placeholder="Frequency (e.g. Twice daily)" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setMedications([...medications, { name: "", dosage: "", frequency: "" }])}
            className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-2.5 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
            + Add Another Medication
          </button>
        </div>

        {/* Conditions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Medical Conditions</h3>
          {conditions.map((cond, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputClass} value={cond.name} onChange={(e) => updateArrayItem(conditions, i, "name", e.target.value, setConditions)} placeholder="Condition (e.g. Type 2 Diabetes)" />
              {conditions.length > 1 && (
                <button type="button" onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-sm font-bold px-2">&times;</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setConditions([...conditions, { name: "" }])}
            className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-2.5 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
            + Add Another Condition
          </button>
        </div>

        {/* Family Members */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Family Members / Emergency Contacts</h3>
          {familyMembers.map((fm, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400">Contact {i + 1}</span>
                {familyMembers.length > 1 && (
                  <button type="button" onClick={() => setFamilyMembers(familyMembers.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input className={inputClass} value={fm.name} onChange={(e) => updateArrayItem(familyMembers, i, "name", e.target.value, setFamilyMembers)} placeholder="Full name" />
                <input className={inputClass} value={fm.relationship} onChange={(e) => updateArrayItem(familyMembers, i, "relationship", e.target.value, setFamilyMembers)} placeholder="Relationship (e.g. Daughter)" />
                <input type="tel" className={inputClass} value={fm.phone} onChange={(e) => updateArrayItem(familyMembers, i, "phone", e.target.value, setFamilyMembers)} placeholder="Phone" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setFamilyMembers([...familyMembers, { name: "", relationship: "", phone: "" }])}
            className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-2.5 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
            + Add Another Family Member
          </button>
        </div>

        {/* Insurance */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Insurance</h3>
          {insurances.map((ins, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400">{i === 0 ? "Primary" : "Additional"} Insurance{i > 0 ? ` #${i + 1}` : ""}</span>
                {insurances.length > 1 && i > 0 && (
                  <button type="button" onClick={() => setInsurances(insurances.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={inputClass} value={ins.company} onChange={(e) => updateArrayItem(insurances, i, "company", e.target.value, setInsurances)} placeholder="Insurance company" />
                <input className={inputClass} value={ins.memberId} onChange={(e) => updateArrayItem(insurances, i, "memberId", e.target.value, setInsurances)} placeholder="Member / Subscriber ID" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={inputClass} value={ins.groupNumber} onChange={(e) => updateArrayItem(insurances, i, "groupNumber", e.target.value, setInsurances)} placeholder="Group number" />
                <input className={inputClass} value={ins.policyHolder} onChange={(e) => updateArrayItem(insurances, i, "policyHolder", e.target.value, setInsurances)} placeholder="Policy holder name" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setInsurances([...insurances, { company: "", memberId: "", groupNumber: "", policyHolder: "" }])}
            className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-2.5 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
            + Add Another Insurance
          </button>
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
