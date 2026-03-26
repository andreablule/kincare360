"use client";

import { useEffect, useState } from "react";

const PLANS = [
  {
    key: "BASIC",
    stripeKey: "basic",
    name: "Basic",
    price: "$99/mo",
    features: [
      "Daily wellness check-in calls",
      "Medication reminder calls (per your schedule)",
      "Weekly family update",
      "Emergency escalation protocol",
    ],
  },
  {
    key: "STANDARD",
    stripeKey: "standard",
    name: "Standard",
    price: "$199/mo",
    popular: true,
    features: [
      "Everything in Basic",
      "Appointment scheduling & coordination",
      "Prescription refill reminders",
      "Family dashboard",
      "Bi-weekly family call",
    ],
  },
  {
    key: "PREMIUM",
    stripeKey: "premium",
    name: "Premium",
    price: "$299/mo",
    features: [
      "Everything in Standard",
      "Priority same-day response",
      "Full family dashboard",
      "Monthly care report",
      "Doctor & pharmacy liaison",
    ],
  },
];

export default function PlanPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan);
        setStatus(data.subscriptionStatus);
        setTrialEnd(data.trialEnd || null);
        setLoading(false);
      });
  }, []);

  async function selectPlan(stripeKey: string) {
    setUpgrading(stripeKey);
    try {
      const res = await fetch("/api/plan/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: stripeKey, action: stripeKey === "cancel" ? "cancel" : "change" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to process. Please try again or contact support.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setUpgrading(null);
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const currentPlan = PLANS.find((p) => p.key === plan);

  const trialEndDate = trialEnd
    ? new Date(trialEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-2">Plan Management</h1>

      {/* Current plan status banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Current Plan</div>
            <div className="text-xl font-bold text-navy">
              {currentPlan ? `${currentPlan.name} — ${currentPlan.price}` : "No active plan"}
            </div>
          </div>
          {status && (
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              status === "active" ? "bg-teal/10 text-teal" :
              status === "trialing" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-500"
            }`}>
              {status === "trialing" ? "Free Trial" : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>

        {status === "trialing" && trialEnd && (
          <div className="mt-3 bg-blue-50 text-blue-700 rounded-xl px-4 py-2.5 text-sm">
            🎁 Free trial — <strong>{Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000))} days remaining</strong> (ends {new Date(trialEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}). No charge until then — cancel anytime.
          </div>
        )}

        {status === "active" && currentPlan && (
          <div className="mt-3 text-sm text-gray-500">
            You&apos;re billed <strong>{currentPlan.price}</strong> monthly. Cancel anytime from below.
          </div>
        )}
      </div>

      {/* Plan picker */}
      <h2 className="text-base font-semibold text-navy mb-3">
        {plan ? "Switch Plan" : "Choose a Plan"}
      </h2>

      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mb-6">
        {PLANS.map((p) => {
          const isCurrent = p.key === plan;
          return (
            <div
              key={p.key}
              className={`bg-white rounded-2xl border p-5 flex flex-col relative ${
                p.popular ? "border-teal shadow-sm" : "border-gray-100"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-navy text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current
                </div>
              )}

              <div className="mb-1">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{p.name}</div>
                <div className="text-2xl font-bold text-navy mt-0.5">{p.price}</div>
                <div className="text-xs text-gray-400">+ 7-day free trial</div>
              </div>

              <ul className="space-y-2 my-4 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => selectPlan(p.stripeKey)}
                disabled={isCurrent || upgrading === p.stripeKey}
                className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 ${
                  isCurrent
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : p.popular
                    ? "bg-teal text-white hover:bg-teal-dark"
                    : "border border-teal text-teal hover:bg-teal hover:text-white"
                }`}
              >
                {upgrading === p.stripeKey
                  ? "Redirecting..."
                  : isCurrent
                  ? "Current Plan"
                  : plan
                  ? "Switch to This Plan"
                  : "Start Free Trial"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cancel subscription */}
      {plan && (
        <div className="max-w-2xl">
          <div className="border-t border-gray-100 pt-5 mt-2">
            <h3 className="text-sm font-semibold text-navy mb-1">Cancel Subscription</h3>
            <p className="text-sm text-gray-400 mb-3">
              You can cancel anytime. If you&apos;re on a free trial, you won&apos;t be charged. Cancellation takes effect at the end of your billing period.
            </p>
            <button
              onClick={() => selectPlan("cancel")}
              disabled={!!upgrading}
              className="border border-red-300 text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {upgrading === "cancel" ? "Opening..." : "Cancel Subscription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
