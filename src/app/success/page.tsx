"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [confirmed, setConfirmed] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [trialEnd, setTrialEnd] = useState("");

  useEffect(() => {
    if (sessionId && !confirmed) {
      fetch("/api/stripe-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setConfirmed(true);
            setCustomerName(data.customer?.name || "");
            setTrialEnd(data.trialEnd || "");
          }
        })
        .catch(() => {});
    }
  }, [sessionId, confirmed]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal/10 text-teal mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">
          Welcome to KinCare360{customerName ? `, ${customerName.split(" ")[0]}` : ""}! 🎉
        </h1>
        <p className="text-gray-600 text-lg mb-3">
          Your 7-day free trial has started. No charge until your trial ends.
        </p>
        {trialEnd && (
          <p className="text-sm text-teal font-medium mb-3">
            Trial ends: {trialEnd}
          </p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          Lily will call you within 24 hours to set up your care plan and get you started.
          {confirmed && " A confirmation has been sent to your phone."}
          {" "}Questions? Call or text{" "}
          <a href="tel:+18125155252" className="text-teal font-medium">(812) 515-5252</a>
        </p>
        <div className="space-y-3">
          <a href="/" className="block bg-teal text-white px-8 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors">
            Back to Home
          </a>
          <a href="tel:+18125155252" className="block border-2 border-teal text-teal px-8 py-3 rounded-full font-semibold hover:bg-teal hover:text-white transition-colors">
            Call Lily: (812) 515-5252
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
