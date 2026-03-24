"use client";

import { useEffect, useState } from "react";

const planDetails: Record<string, { name: string; price: string; features: string[] }> = {
  BASIC: {
    name: "Starter",
    price: "$99/mo",
    features: ["Daily wellness check-in calls", "Medication reminders", "Weekly family update", "Emergency escalation protocol"],
  },
  STANDARD: {
    name: "Essential",
    price: "$199/mo",
    features: ["Everything in Starter", "Appointment scheduling", "Prescription refill reminders", "Family dashboard", "Bi-weekly family call"],
  },
  PREMIUM: {
    name: "Premium",
    price: "$299/mo",
    features: ["Everything in Essential", "Priority same-day response", "Full family dashboard", "Monthly care report", "Direct coordinator line", "Doctor & pharmacy liaison"],
  },
};

export default function PlanPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan);
        setStatus(data.subscriptionStatus);
        setLoading(false);
      });
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/plan/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to open billing portal. Please contact support.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setPortalLoading(false);
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const details = plan ? planDetails[plan] : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Plan Management</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Current Plan</div>
            <div className="text-xl font-bold text-navy mt-1">{details?.name || plan || "No active plan"}</div>
          </div>
          {details && (
            <div className="text-2xl font-bold text-teal">{details.price}</div>
          )}
        </div>

        {status && (
          <div className="mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              status === "active" ? "bg-teal/10 text-teal" :
              status === "trialing" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        )}

        {details && (
          <ul className="space-y-2 mb-6">
            {details.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-teal flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40"
        >
          {portalLoading ? "Opening..." : "Manage Subscription"}
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Upgrade, downgrade, or cancel your subscription via Stripe
        </p>
      </div>

      {!plan && (
        <div className="bg-teal/5 rounded-2xl border border-teal/20 p-6 max-w-lg">
          <h2 className="text-sm font-semibold text-navy mb-2">No active subscription</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose a plan to get started with KinCare360 care coordination.
          </p>
          <a
            href="/#pricing"
            className="inline-block bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-dark"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
