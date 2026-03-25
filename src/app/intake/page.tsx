"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = ["Patient Info", "Medical Info", "Family & Services", "Review & Pay"];

const timeOptions = Array.from({length: 28}, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? "00" : "30";
  if (hour > 20) return null;
  const h12 = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return { value: `${String(hour).padStart(2,'0')}:${min}`, label: `${h12}:${min} ${ampm}` };
}).filter(Boolean) as {value: string; label: string}[];

function AddressAutocomplete({ value, onChange, onSelect, className, placeholder }: { 
  value: string; onChange: (v: string) => void; onSelect: (address: string, city: string, state: string, zip: string) => void; className: string; placeholder: string; 
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  async function handleInput(val: string) {
    onChange(val);
    if (val.length < 3) { setSuggestions([]); return; }
    
    try {
      const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch { /* ignore */ }
  }

  function selectSuggestion(s: any) {
    onSelect(s.address, s.city, s.state, s.zip);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <input className={className} value={value} onChange={e => handleInput(e.target.value)} 
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder={placeholder} />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onMouseDown={() => selectSuggestion(s)}
              className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-teal/5 border-b border-gray-50 last:border-0">
              {s.full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [form, setForm] = useState({
    patientName: "", dob: "", phone: "", email: "", address: "", city: "", state: "", zip: "",
    primaryDoctor: "", doctorPhone: "", doctorAddress: "",
    pharmacy: "", pharmacyPhone: "", pharmacyAddress: "",
    medications: "", conditions: "", allergies: "",
    checkInTime: "09:00",
    medicationReminders: [{ time: "08:00" }] as {time: string}[],
    checkInDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
    familyContacts: [{ name: "", phone: "", email: "", relation: "" }] as {name: string; phone: string; email: string; relation: string}[],
    services: [] as string[],
    notes: "",
    selectedPlan: "",
  });

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleService(service: string) {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  }

  function addMedicationReminder() {
    setForm(prev => ({ ...prev, medicationReminders: [...prev.medicationReminders, { time: "08:00" }] }));
  }

  function removeMedicationReminder(index: number) {
    setForm(prev => ({ ...prev, medicationReminders: prev.medicationReminders.filter((_, i) => i !== index) }));
  }

  function updateMedicationReminder(index: number, time: string) {
    setForm(prev => ({
      ...prev,
      medicationReminders: prev.medicationReminders.map((r, i) => i === index ? { time } : r)
    }));
  }

  function addFamilyContact() {
    setForm(prev => ({ ...prev, familyContacts: [...prev.familyContacts, { name: "", phone: "", email: "", relation: "" }] }));
  }

  function removeFamilyContact(index: number) {
    if (form.familyContacts.length <= 1) return;
    setForm(prev => ({ ...prev, familyContacts: prev.familyContacts.filter((_, i) => i !== index) }));
  }

  function updateFamilyContact(index: number, field: string, value: string) {
    setForm(prev => ({
      ...prev,
      familyContacts: prev.familyContacts.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Save intake data first
      await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      // Redirect to Stripe checkout via server-side API (handles price mapping)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: form.selectedPlan,
          email: form.email || form.familyContacts[0]?.email || '',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong with payment setup. Please call (812) 515-5252 for help.');
        setSubmitting(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm";
  const labelClass = "block text-sm font-medium text-navy mb-1";

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <a href="/"><img src="/kincare360-logo.png" alt="KinCare360" className="h-12 w-auto mx-auto mb-4" /></a>
          <h1 className="text-2xl font-bold text-navy">Get Started with KinCare360</h1>
          <p className="text-gray-500 mt-1">Fill out your care plan details, then start your 7-day free trial.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > i ? 'bg-teal text-white' : step === i ? 'bg-teal text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i ? 'text-teal font-medium' : 'text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${step > i ? 'bg-teal' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

          {/* Step 0 — Patient Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-navy mb-4">Patient Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Patient Full Name *</label>
                  <input className={inputClass} value={form.patientName} onChange={e => update('patientName', e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" className={inputClass} value={form.dob} onChange={e => update('dob', e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input type="tel" className={inputClass} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(215) 555-0123" />
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" className={inputClass} value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Home Address *</label>
                <AddressAutocomplete className={inputClass} value={form.address} placeholder="Start typing address..."
                  onChange={v => update('address', v)}
                  onSelect={(address, city, state, zip) => setForm(prev => ({ ...prev, address, city, state, zip }))} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><label className={labelClass}>City *</label><input className={inputClass} value={form.city} onChange={e => update('city', e.target.value)} placeholder="City" /></div>
                <div><label className={labelClass}>State *</label><input className={inputClass} value={form.state} onChange={e => update('state', e.target.value)} placeholder="PA" maxLength={2} /></div>
                <div><label className={labelClass}>ZIP *</label><input className={inputClass} value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="19103" /></div>
              </div>

              {/* Call Preferences */}
              <div className="border border-teal/20 rounded-xl p-4 space-y-4 bg-teal/5 mt-2">
                <h3 className="text-sm font-semibold text-navy">📞 Call Preferences</h3>
                <div>
                  <label className={labelClass}>Daily Wellness Check-In Time *</label>
                  <select className={inputClass} value={form.checkInTime} onChange={e => update('checkInTime', e.target.value)}>
                    {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Multiple Medication Reminders */}
                <div>
                  <label className={labelClass}>Medication Reminder Times *</label>
                  {form.medicationReminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <select className={inputClass} value={reminder.time} onChange={e => updateMedicationReminder(index, e.target.value)}>
                        {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      {form.medicationReminders.length > 1 && (
                        <button type="button" onClick={() => removeMedicationReminder(index)} className="text-red-400 hover:text-red-600 text-sm font-bold px-2">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addMedicationReminder} className="text-teal text-sm font-medium hover:underline mt-1">
                    + Add another reminder time
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Lily will call at each time to remind about medications</p>
                </div>

                <div>
                  <label className={labelClass}>Preferred Days for Calls *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                      <button key={day} type="button"
                        onClick={() => setForm(prev => ({ ...prev, checkInDays: prev.checkInDays.includes(day) ? prev.checkInDays.filter(d => d !== day) : [...prev.checkInDays, day] }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${form.checkInDays.includes(day) ? 'bg-teal text-white border-teal' : 'bg-white text-gray-500 border-gray-300 hover:border-teal'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => { if (form.patientName && form.phone && form.email && form.address) setStep(1); }}
                disabled={!form.patientName || !form.phone || !form.email || !form.address}
                className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40 mt-2">
                Next →
              </button>
            </div>
          )}

          {/* Step 1 — Medical Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-navy mb-4">Medical Information</h2>
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-navy">Primary Doctor</h3>
                <input className={inputClass} value={form.primaryDoctor} onChange={e => update('primaryDoctor', e.target.value)} placeholder="Doctor's full name" />
                <input type="tel" className={inputClass} value={form.doctorPhone} onChange={e => update('doctorPhone', e.target.value)} placeholder="Doctor's phone number" />
                <input className={inputClass} value={form.doctorAddress} onChange={e => update('doctorAddress', e.target.value)} placeholder="Doctor's office address" />
              </div>
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-navy">Pharmacy</h3>
                <input className={inputClass} value={form.pharmacy} onChange={e => update('pharmacy', e.target.value)} placeholder="Pharmacy name" />
                <input type="tel" className={inputClass} value={form.pharmacyPhone} onChange={e => update('pharmacyPhone', e.target.value)} placeholder="Pharmacy phone number" />
                <input className={inputClass} value={form.pharmacyAddress} onChange={e => update('pharmacyAddress', e.target.value)} placeholder="Pharmacy address" />
              </div>
              <div><label className={labelClass}>Current Medications</label><textarea className={inputClass + " resize-none"} rows={3} value={form.medications} onChange={e => update('medications', e.target.value)} placeholder="List medications and dosages (e.g. Metformin 500mg, Lisinopril 10mg)" /></div>
              <div><label className={labelClass}>Medical Conditions</label><textarea className={inputClass + " resize-none"} rows={2} value={form.conditions} onChange={e => update('conditions', e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension" /></div>
              <div><label className={labelClass}>Known Allergies</label><input className={inputClass} value={form.allergies} onChange={e => update('allergies', e.target.value)} placeholder="e.g. Penicillin, Sulfa, None known" /></div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors">Next →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Family + Services */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-navy mb-4">Family Contacts & Services</h2>

              {form.familyContacts.map((contact, index) => (
                <div key={index} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-navy">{index === 0 ? 'Primary' : `Additional`} Family Contact {index > 0 ? `#${index + 1}` : ''}</h3>
                    {index > 0 && (
                      <button type="button" onClick={() => removeFamilyContact(index)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className={inputClass} value={contact.name} onChange={e => updateFamilyContact(index, 'name', e.target.value)} placeholder="Full name" />
                    <input className={inputClass} value={contact.relation} onChange={e => updateFamilyContact(index, 'relation', e.target.value)} placeholder="Relationship (e.g. Daughter)" />
                  </div>
                  <input type="tel" className={inputClass} value={contact.phone} onChange={e => updateFamilyContact(index, 'phone', e.target.value)} placeholder="Phone number" />
                  <input type="email" className={inputClass} value={contact.email} onChange={e => updateFamilyContact(index, 'email', e.target.value)} placeholder="Email address (for dashboard access)" />
                </div>
              ))}

              <button type="button" onClick={addFamilyContact} className="w-full border-2 border-dashed border-teal/30 text-teal rounded-xl py-3 text-sm font-medium hover:border-teal hover:bg-teal/5 transition-colors">
                + Add Another Family Contact
              </button>

              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Services Requested</h3>
                <div className="space-y-2">
                  {["Daily Wellness Check-In Calls", "Medication Reminders", "Appointment Scheduling & Coordination", "Prescription Refill Requests", "Family Dashboard Updates", "Emergency Contact Notification"].map(service => (
                    <label key={service} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 border border-gray-100">
                      <input type="checkbox" checked={form.services.includes(service)} onChange={() => toggleService(service)} className="w-4 h-4 accent-teal" />
                      <span className="text-sm text-navy">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div><label className={labelClass}>Additional Notes</label><textarea className={inputClass + " resize-none"} rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Anything else we should know..." /></div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(3)} disabled={!form.familyContacts[0]?.name || !form.familyContacts[0]?.phone}
                  className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review + Select Plan + Pay */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-navy mb-4">Review & Select Your Plan</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Patient</span><span className="font-medium text-navy">{form.patientName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-navy">{form.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-navy">{form.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Check-In</span><span className="font-medium text-navy">{form.checkInTime} ({form.checkInDays.join(', ')})</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Med Reminders</span><span className="font-medium text-navy">{form.medicationReminders.map(r => timeOptions.find(t => t.value === r.time)?.label).join(', ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Family Contacts</span><span className="font-medium text-navy">{form.familyContacts.filter(c => c.name).length}</span></div>
              </div>

              {/* Plan Selection */}
              <h3 className="text-sm font-semibold text-navy mt-4">Choose Your Plan</h3>
              <div className="space-y-3">
                {[
                  { id: "starter", name: "Starter", price: "$99/mo", features: "Daily check-ins, medication reminders, emergency alerts" },
                  { id: "essential", name: "Essential", price: "$199/mo", features: "Everything in Starter + appointments, refills, family dashboard", popular: true },
                  { id: "premium", name: "Premium", price: "$299/mo", features: "Everything in Essential + priority 24/7 access, appointment booking, refill management" },
                ].map(plan => (
                  <button key={plan.id} type="button" onClick={() => update('selectedPlan', plan.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${form.selectedPlan === plan.id ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-teal/50'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-navy">{plan.name}</span>
                        {plan.popular && <span className="ml-2 text-xs bg-teal text-white px-2 py-0.5 rounded-full">Most Popular</span>}
                      </div>
                      <span className="font-bold text-navy">{plan.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.features}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-teal font-medium text-center">🎉 7-day free trial — no charge until day 8</p>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-teal transition-colors">
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="w-5 h-5 mt-0.5 accent-teal flex-shrink-0" />
                <span className="text-xs text-gray-600">
                  I agree to KinCare360&apos;s <a href="/terms" target="_blank" className="text-teal underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-teal underline">Privacy Policy</a>. I understand KinCare360 is a non-medical care coordination service, not a substitute for emergency care (call 911), and my 7-day trial auto-converts to a paid subscription unless cancelled.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={handleSubmit} disabled={submitting || !agreedToTerms || !form.selectedPlan}
                  className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
                  {submitting ? 'Processing...' : 'Start Free Trial →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Need help? Call <a href="tel:+18125155252" className="text-teal font-medium">(812) 515-5252</a>
        </p>
      </div>
    </main>
  );
}
