"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const services = [
  "Care Consultation (Free)",
  "Essential Plan - $299/mo",
  "Premium Plan - $349/mo",
  "Medication Reminder Setup",
  "Family Dashboard Setup",
];

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "1:00 PM",
  "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
  "3:30 PM", "4:00 PM", "4:30 PM",
];

function getNext14Days() {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
      days.push({
        value: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      });
    }
  }
  return days;
}

export default function BookPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date: '', time: '', service: services[0], message: '',
  });

  const days = getNext14Days();

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/thank-you?booked=true');
      } else {
        setError('Something went wrong. Please try again or call us directly.');
        setSubmitting(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-12 w-auto mx-auto mb-4" />
          </a>
          <h1 className="text-2xl font-bold text-navy">Book an Appointment</h1>
          <p className="text-gray-500 mt-1">Free consultation · No commitment · Confirmation sent by text</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-teal text-white' : 'bg-gray-200 text-gray-400'}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-teal' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-navy mb-4">Your Information</h2>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Phone Number *</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="(215) 555-0123" />
                <p className="text-xs text-gray-400 mt-1">Confirmation sent to this number</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Email (optional)</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Service</label>
                <select value={form.service} onChange={e => update('service', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal">
                  {services.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => { if (form.name && form.phone) setStep(2); }}
                disabled={!form.name || !form.phone}
                className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40 mt-2">
                Next →
              </button>
            </div>
          )}

          {/* Step 2 — Pick Date & Time */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-navy mb-4">Pick a Date & Time</h2>
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Select Date *</label>
                <div className="grid grid-cols-2 gap-2">
                  {days.map(d => (
                    <button key={d.value} onClick={() => update('date', d.label)}
                      className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${form.date === d.label ? 'bg-teal text-white border-teal' : 'border-gray-200 text-navy hover:border-teal'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.date && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">Select Time *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(t => (
                      <button key={t} onClick={() => update('time', t)}
                        className={`px-2 py-2 rounded-xl border text-sm font-medium transition-colors ${form.time === t ? 'bg-teal text-white border-teal' : 'border-gray-200 text-navy hover:border-teal'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button onClick={() => { if (form.date && form.time) setStep(3); }}
                  disabled={!form.date || !form.time}
                  className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-navy mb-4">Confirm Your Booking</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-navy">{form.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-navy">{form.phone}</span></div>
                {form.email && <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-navy">{form.email}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium text-navy">{form.service}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium text-navy">{form.date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium text-navy">{form.time}</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Additional Notes (optional)</label>
                <textarea value={form.message} onChange={e => update('message', e.target.value)}
                  rows={3} placeholder="Tell us about your loved one's care needs..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="w-4 h-4 mt-0.5 accent-teal flex-shrink-0" />
                <span className="text-xs text-gray-500">
                  I agree to KinCare360's{' '}
                  <a href="/terms" target="_blank" className="text-teal underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-teal underline">Privacy Policy</a>,
                  and consent to receive SMS confirmations. Reply STOP to opt out.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 text-navy py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-60">
                  {submitting ? 'Booking...' : 'Confirm Booking ✓'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Questions? Call or text <a href="tel:+18125155252" className="text-teal font-medium">(812) 515-5252</a>
        </p>
      </div>
    </main>
  );
}

