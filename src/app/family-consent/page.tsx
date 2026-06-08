"use client";

import { useState } from "react";
import Link from "next/link";

function digits(value: string) { return value.replace(/\D/g, "").slice(-10); }

export default function FamilyConsentPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [lovedOne, setLovedOne] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{type:"success"|"error"; message:string}|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!phone.trim() && !checked) {
      return setResult({ type: "success", message: "No SMS consent was recorded. You will not be enrolled in KinCare360 text updates unless you provide a mobile number and choose the SMS consent option." });
    }
    if (checked && digits(phone).length !== 10) return setResult({ type: "error", message: "Please enter a valid U.S. mobile number to enroll in KinCare360 text updates." });
    if (phone.trim() && !checked) return setResult({ type: "error", message: "To enroll this mobile number for KinCare360 text updates, please choose the optional SMS consent checkbox. Leave the phone field blank if you do not want SMS enrollment." });
    setLoading(true);
    try {
      const res = await fetch("/api/family-consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, lovedOne, consent: checked }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Consent could not be recorded.");
      setResult({ type: "success", message: "Consent recorded. You are now enrolled to receive KinCare360 family updates, routine reminders, family concern notifications, and non-medical family follow-up notices by text message." });
    } catch (err: any) {
      setResult({ type: "error", message: err.message || "Consent could not be recorded." });
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <Link href="/" className="text-teal font-bold text-xl">KinCare360</Link>
        <h1 className="text-3xl font-bold text-navy mt-6">Family SMS Consent</h1>
        <p className="text-gray-600 mt-3 leading-relaxed">Use this optional form only if your family invited you to receive KinCare360 text updates about a loved one. Providing a mobile number and choosing SMS consent are optional and used only to enroll you in text updates.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div><label className="block text-sm font-semibold text-navy mb-1">Your name</label><input required value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal" placeholder="Jane Family" /></div>
          <div><label className="block text-sm font-semibold text-navy mb-1">Mobile phone number <span className="font-normal text-gray-500">(optional; required only if you choose SMS consent)</span></label><input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal" placeholder="(555) 123-4567" /></div>
          <div><label className="block text-sm font-semibold text-navy mb-1">Loved one&apos;s name</label><input required value={lovedOne} onChange={e=>setLovedOne(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal" placeholder="Parent or loved one name" /></div>
          <label className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} className="mt-1 h-4 w-4" /><span><strong>Optional SMS consent:</strong> I agree to receive recurring automated SMS/text messages from KinCare360 about my loved one, including daily check-in summaries, family-approved routine reminders, appointment updates, family concern notifications, and time-sensitive family follow-up notices if my loved one shares a non-medical everyday concern that may need family attention. Message frequency varies, up to 5 messages per day. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help. Consent is not a condition of purchase. KinCare360 is not an emergency, crisis, medical, or in-home care service. I have read the <Link href="/privacy" className="text-teal underline">Privacy Policy</Link> and <Link href="/terms" className="text-teal underline">Terms of Service</Link>.</span></label>
          <button disabled={loading} className="w-full rounded-xl bg-teal text-white font-bold py-3 disabled:opacity-60">{loading ? "Recording preference..." : "Submit SMS Preference"}</button>
        </form>
        {result && <div className={`mt-5 rounded-xl p-4 text-sm ${result.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{result.message}</div>}
        <p className="text-xs text-gray-500 mt-8 leading-relaxed">Need help? Email <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a> or call <a href="tel:+12727669090" className="text-teal underline">+1 272 766 9090</a>. To stop texts after enrollment, reply STOP to any message.</p>
      </div>
    </main>
  );
}
