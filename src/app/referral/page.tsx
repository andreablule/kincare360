"use client";

import { useState } from "react";

export default function ReferralPage() {
  const [name, setName] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; link: string } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "doctor",
          name,
          practiceName,
          email,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <a href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-28 w-auto mx-auto mb-6" />
          </a>
          <h1 className="text-2xl font-bold text-navy">Physician Referral Program</h1>
          <p className="text-gray-500 mt-2">
            Earn $50 for every patient you refer to KinCare360.
          </p>
        </div>

        {result ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-navy mb-2">Your Referral Code</h2>
            <div className="bg-gray-50 rounded-xl px-6 py-4 mb-4">
              <p className="text-2xl font-mono font-bold text-teal">{result.code}</p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Share this link with your patients:
            </p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
              <p className="text-sm font-medium text-navy break-all">{result.link}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(result.link); }}
              className="bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm"
            >
              Copy Referral Link
            </button>
            <p className="text-xs text-gray-400 mt-4">
              You earn $50 for each patient who signs up using your code.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Sign up below to get your unique referral code. When your patients sign up using your code, you earn $50 per referral.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
                placeholder="Dr. Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Practice Name</label>
              <input
                type="text"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
                placeholder="Main Street Family Medicine"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
                placeholder="doctor@practice.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
                placeholder="(555) 123-4567"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40"
            >
              {loading ? "Creating..." : "Get My Referral Code"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Call <a href="tel:+18125155252" className="text-teal hover:underline">(812) 515-5252</a>
        </p>
      </div>
    </main>
  );
}
