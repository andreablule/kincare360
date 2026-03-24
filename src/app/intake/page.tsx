"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = ["Patient Info", "Medical Info", "Family Access", "Complete"];

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [form, setForm] = useState({
    // Patient info
    patientName: "", dob: "", phone: "", email: "", address: "", city: "", state: "", zip: "",
    // Medical info
    primaryDoctor: "", doctorPhone: "", doctorAddress: "",
    pharmacy: "", pharmacyPhone: "", pharmacyAddress: "",
    medications: "", conditions: "", allergies: "",
    // Family contact
    familyName: "", familyPhone: "", familyEmail: "", familyRelation: "",
    familyName2: "", familyPhone2: "", familyEmail2: "", familyRelation2: "",
    // Services requested
    services: [] as string[],
    notes: "",
  });

  function update(field: string, value: string) {
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

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.push('/success');
    } catch {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm";
  const labelClass = "block text-sm font-medium text-navy mb-1";

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/"><img src="/kincare360-logo.png" alt="KinCare360" className="h-12 w-auto mx-auto mb-4" /></a>
          <h1 className="text-2xl font-bold text-navy">Welcome to KinCare360!</h1>
          <p className="text-gray-500 mt-1">Your 7-day free trial is active. Let's set up your care plan.</p>
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
                  <label className={labelClass}>Email Address</label>
                  <input type="email" className={inputClass} value={form.email} onChange={e => update('email', e.target.value)} placeholder="patient@email.com" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Home Address *</label>
                <input className={inputClass} value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className={labelClass}>City *</label>
                  <input className={inputClass} value={form.city} onChange={e => update('city', e.target.value)} placeholder="City" />
                </div>
                <div>
                  <label className={labelClass}>State *</label>
                  <input className={inputClass} value={form.state} onChange={e => update('state', e.target.value)} placeholder="PA" maxLength={2} />
                </div>
                <div>
                  <label className={labelClass}>ZIP *</label>
                  <input className={inputClass} value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="19103" />
                </div>
              </div>
              <button onClick={() => { if (form.patientName && form.phone && form.address) setStep(1); }}
                disabled={!form.patientName || !form.phone || !form.address}
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

              <div>
                <label className={labelClass}>Current Medications</label>
                <textarea className={inputClass + " resize-none"} rows={3} value={form.medications} onChange={e => update('medications', e.target.value)} placeholder="List medications and dosages (e.g. Metformin 500mg, Lisinopril 10mg)" />
              </div>
              <div>
                <label className={labelClass}>Medical Conditions / Diagnoses</label>
                <textarea className={inputClass + " resize-none"} rows={2} value={form.conditions} onChange={e => update('conditions', e.target.value)} placeholder="e.g. Type 2 Diabetes, Hypertension, Arthritis" />
              </div>
              <div>
                <label className={labelClass}>Known Allergies</label>
                <input className={inputClass} value={form.allergies} onChange={e => update('allergies', e.target.value)} placeholder="e.g. Penicillin, Sulfa, None known" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors">Next →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Family + Services */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-navy mb-4">Family Access & Services</h2>

              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-navy">Primary Family Contact</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className={inputClass} value={form.familyName} onChange={e => update('familyName', e.target.value)} placeholder="Full name" />
                  <input className={inputClass} value={form.familyRelation} onChange={e => update('familyRelation', e.target.value)} placeholder="Relationship (e.g. Daughter)" />
                </div>
                <input type="tel" className={inputClass} value={form.familyPhone} onChange={e => update('familyPhone', e.target.value)} placeholder="Phone number" />
                <input type="email" className={inputClass} value={form.familyEmail} onChange={e => update('familyEmail', e.target.value)} placeholder="Email address (for dashboard access)" />
              </div>

              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-navy">Secondary Family Contact (optional)</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className={inputClass} value={form.familyName2} onChange={e => update('familyName2', e.target.value)} placeholder="Full name" />
                  <input className={inputClass} value={form.familyRelation2} onChange={e => update('familyRelation2', e.target.value)} placeholder="Relationship" />
                </div>
                <input type="tel" className={inputClass} value={form.familyPhone2} onChange={e => update('familyPhone2', e.target.value)} placeholder="Phone number" />
                <input type="email" className={inputClass} value={form.familyEmail2} onChange={e => update('familyEmail2', e.target.value)} placeholder="Email address" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Services Requested</h3>
                <div className="space-y-2">
                  {[
                    "Daily Wellness Check-In Calls",
                    "Medication Reminders",
                    "Appointment Scheduling & Coordination",
                    "Prescription Refill Requests",
                    "Family Dashboard Updates",
                    "Emergency Contact Notification",
                  ].map(service => (
                    <label key={service} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 border border-gray-100">
                      <input type="checkbox" checked={form.services.includes(service)} onChange={() => toggleService(service)}
                        className="w-4 h-4 accent-teal" />
                      <span className="text-sm text-navy">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Additional Notes or Special Instructions</label>
                <textarea className={inputClass + " resize-none"} rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Anything else we should know about your loved one's care needs..." />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(3)} disabled={!form.familyName || !form.familyPhone}
                  className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-navy mb-4">Review & Submit</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Patient</span><span className="font-medium text-navy">{form.patientName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date of Birth</span><span className="font-medium text-navy">{form.dob}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-navy">{form.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-navy">{form.address}, {form.city} {form.state}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="font-medium text-navy">{form.primaryDoctor || 'Not provided'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pharmacy</span><span className="font-medium text-navy">{form.pharmacy || 'Not provided'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Family Contact</span><span className="font-medium text-navy">{form.familyName} ({form.familyRelation})</span></div>
                {form.services.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Services:</span>
                    <div className="mt-1 space-y-1">
                      {form.services.map(s => <div key={s} className="text-navy font-medium">• {s}</div>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms agreement checkbox */}
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-teal transition-colors">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-teal flex-shrink-0"
                />
                <span className="text-sm text-gray-600">
                  I have read and agree to KinCare360's{' '}
                  <a href="/terms" target="_blank" className="text-teal underline font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-teal underline font-medium">Privacy Policy</a>.
                  I understand that my 7-day free trial will automatically convert to a paid subscription unless cancelled.
                </span>
              </label>

              {!agreedToTerms && (
                <p className="text-xs text-amber-500">⚠️ Please agree to the terms before submitting.</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={handleSubmit} disabled={submitting || !agreedToTerms}
                  className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
                  {submitting ? 'Submitting...' : 'Submit & Start Care ✓'}
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
