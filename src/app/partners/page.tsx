"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Conversion {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
}

interface ReferralStats {
  code: string;
  referrerName: string;
  earnings: number;
  referralCount: number;
  conversions: Conversion[];
}

function PartnersContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");
  const connected = searchParams.get("connected");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [type, setType] = useState("Doctor");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; link: string } | null>(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  // If code in URL, load stats
  useEffect(() => {
    if (codeParam) {
      fetch(`/api/referral?code=${codeParam}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) {
            setStats(d);
            setResult({ code: d.code, link: `https://kincare360.com/register?ref=${d.code}` });
          }
        })
        .catch(() => {});
    }
  }, [codeParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "partner",
          name,
          practiceName: practiceName || null,
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

  async function handleConnect() {
    if (!result) return;
    setConnectLoading(true);

    try {
      const res = await fetch("/api/referral/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: result.code }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to connect bank");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setConnectLoading(false);
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.link);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <a href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-28 w-auto mx-auto mb-6" />
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">
            Earn $50 for Every Subscription You Refer
          </h1>
          <p className="text-gray-500 mt-2">
            Partner with KinCare360 and earn cash for every new subscriber.
          </p>
        </div>

        {connected && (
          <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Bank account connected! Payouts will be sent automatically.
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            {/* Code & Link Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">Your Partner Code</h2>
              <div className="bg-gray-50 rounded-xl px-6 py-4 mb-4">
                <p className="text-2xl font-mono font-bold text-teal">{result.code}</p>
              </div>
              <p className="text-sm text-gray-500 mb-2">Share this link:</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm font-medium text-navy break-all">{result.link}</p>
              </div>
              <button
                onClick={copyLink}
                className="bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm w-full"
              >
                Copy Referral Link
              </button>
            </div>

            {/* Connect Bank Button */}
            {!connected && (
              <button
                onClick={handleConnect}
                disabled={connectLoading}
                className="w-full bg-navy text-white px-6 py-4 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                {connectLoading ? "Connecting..." : "Connect Your Bank for Automatic Payouts"}
              </button>
            )}

            {/* Stats (if viewing existing code) */}
            {stats && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-3xl font-bold text-navy">{stats.referralCount}</p>
                    <p className="text-sm text-gray-500 mt-1">Referrals</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-3xl font-bold text-teal">${stats.earnings}</p>
                    <p className="text-sm text-gray-500 mt-1">Earned</p>
                  </div>
                </div>

                {stats.conversions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="text-base font-bold text-navy">Conversions</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {stats.conversions.map((c) => (
                        <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-navy">${c.amount}</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                c.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {c.status === "paid" ? "Paid" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="text-xs text-gray-400 text-center">
              You earn $50 for each new subscriber who uses your code.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Sign up below to get your unique partner referral code. Earn $50 for every new KinCare360 subscription.
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
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
                placeholder="jane@example.com"
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

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Practice / Organization Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
                placeholder="ABC Home Care Agency"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm bg-white"
              >
                <option>Doctor</option>
                <option>Home Care Agency</option>
                <option>Hospital</option>
                <option>Influencer</option>
                <option>Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email}
              className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40"
            >
              {loading ? "Creating..." : "Get My Partner Code"}
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

export default function PartnersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>}>
      <PartnersContent />
    </Suspense>
  );
}
