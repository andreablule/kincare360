"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
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
  const { data: session } = useSession();
  const codeParam = searchParams.get("code");
  const connected = searchParams.get("connected");
  const googleReturn = searchParams.get("google");

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
  const [copied, setCopied] = useState(false);

  // If returning from Google OAuth, auto-fill name and email
  useEffect(() => {
    if (googleReturn && session?.user) {
      if (session.user.name && !name) setName(session.user.name);
      if (session.user.email && !email) setEmail(session.user.email);
    }
  }, [googleReturn, session]);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="mt-6 flex items-center justify-center gap-3 bg-teal/5 rounded-xl px-5 py-4">
            <img
              src="/lily-avatar.png"
              alt="Lily - KinCare360 AI Care Concierge"
              className="w-14 h-14 rounded-full ring-2 ring-teal object-cover flex-shrink-0"
              style={{ objectPosition: 'center 15%' }}
            />
            <p className="text-sm text-navy font-medium text-left">
              Your patients will talk to <span className="font-bold text-teal">Lily</span>, our AI care concierge — friendly, reliable, available 24/7.
            </p>
          </div>
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
                {copied ? '✅ Copied!' : 'Copy Referral Link'}
              </button>
            </div>

            {/* Ready-to-post social media */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-navy mb-3">📱 Ready to Post on Social Media</h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
{`🎉 I just partnered with KinCare360 — a service that provides daily wellness check-in calls, medication reminders, and care coordination for aging parents.

If you or someone you know is caring for an elderly loved one, check it out:
${result.link}

✅ 7-day free trial
✅ Daily check-in calls
✅ Medication reminders
✅ Family dashboard

#ElderCare #AgingParents #KinCare360 #Caregiving`}
              </div>
              <button
                onClick={() => {
                  const text = `🎉 I just partnered with KinCare360 — a service that provides daily wellness check-in calls, medication reminders, and care coordination for aging parents.\n\nIf you or someone you know is caring for an elderly loved one, check it out:\n${result.link}\n\n✅ 7-day free trial\n✅ Daily check-in calls\n✅ Medication reminders\n✅ Family dashboard\n\n#ElderCare #AgingParents #KinCare360 #Caregiving`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-3 w-full bg-navy text-white py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {copied ? '✅ Copied!' : 'Copy Post to Clipboard'}
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

            {/* Cancel participation */}
            <div className="text-center mt-4">
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you want to leave the referral program? Your code will be deactivated.")) return;
                  try {
                    const res = await fetch("/api/referral", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code: result.code }),
                    });
                    if (res.ok) {
                      setResult(null);
                      setStats(null);
                      alert("You have been removed from the referral program.");
                    } else {
                      setError("Failed to cancel. Please email hello@kincare360.com");
                    }
                  } catch {
                    setError("Network error. Please try again.");
                  }
                }}
                className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
              >
                Leave the referral program
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Sign up below to get your unique partner referral code. Earn $50 for every new KinCare360 subscription.
            </p>

            {/* Google Quick Signup */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/partners?google=1" })}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-full py-3 font-semibold text-sm text-navy hover:border-teal hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">or fill in manually</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

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
