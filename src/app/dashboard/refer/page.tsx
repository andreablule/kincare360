"use client";

import { useState, useEffect } from "react";

interface Conversion {
  id: string;
  newCustomerId: string;
  status: string;
  amount: number;
  paidAt: string | null;
  createdAt: string;
}

interface ReferralData {
  code: string;
  link: string;
  referrerName: string;
  earnings: number;
  referralCount: number;
  stats: { pending: number; paid: number; totalEarned: number };
  conversions: Conversion[];
}

export default function ReferPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/my")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaText() {
    if (!data) return;
    window.open(
      `sms:?body=${encodeURIComponent(`Join KinCare360 and get $50 off your first bill! Use my referral link: ${data.link}`)}`,
      "_blank"
    );
  }

  function shareViaEmail() {
    if (!data) return;
    const subject = encodeURIComponent("Get $50 off KinCare360");
    const body = encodeURIComponent(
      `Hi!\n\nI've been using KinCare360 for my family and love it. If you sign up using my referral link, you'll get $50 off your first bill:\n\n${data.link}\n\nKinCare360 provides daily AI check-in calls, medication reminders, and a family dashboard for your aging parent.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Unable to load referral data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-navy">
          Refer a Friend
        </h1>
        <p className="text-lg text-gray-500 mt-1">
          You Both Get <span className="text-teal font-bold">$50</span> Off
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Your Referral Code</p>
        <div className="bg-gray-50 rounded-xl px-6 py-4 mb-4 text-center">
          <p className="text-3xl font-mono font-bold text-teal">{data.code}</p>
        </div>
        <p className="text-sm text-gray-500 mb-3">Share this link:</p>
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <p className="text-sm font-medium text-navy break-all flex-1">{data.link}</p>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 bg-teal text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-teal-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={shareViaText}
            className="flex items-center justify-center gap-2 bg-navy text-white px-4 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Text
          </button>
          <button
            onClick={shareViaEmail}
            className="flex items-center justify-center gap-2 border-2 border-teal text-teal px-4 py-3 rounded-xl font-semibold text-sm hover:bg-teal hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-navy">{data.referralCount}</p>
          <p className="text-sm text-gray-500 mt-1">Total Referrals</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-teal">${data.stats.totalEarned}</p>
          <p className="text-sm text-gray-500 mt-1">Total Earned</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-orange-500">{data.stats.pending}</p>
          <p className="text-sm text-gray-500 mt-1">Pending</p>
        </div>
      </div>

      {/* Conversions Table */}
      {data.conversions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-navy">Conversion History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.conversions.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50">
                    <td className="px-6 py-3 text-navy">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-navy font-medium">${c.amount}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {c.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.conversions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">No referrals yet</h3>
          <p className="text-sm text-gray-500">
            Share your referral link with friends and family. You&apos;ll both get $50 off!
          </p>
        </div>
      )}
    </div>
  );
}
