"use client";

import { useEffect, useState } from "react";

const INDIVIDUAL_PLANS = [
  {
    key: "ESSENTIAL",
    stripeKey: "essential",
    name: "Essential",
    price: "$50/mo",
    features: [
      "Daily wellness check-in calls",
      "Medication reminders",
      "Family dashboard (up to 2 members)",
      "Emergency detection and family alerts",
    ],
  },
  {
    key: "PLUS",
    stripeKey: "plus",
    name: "Plus",
    price: "$80/mo",
    popular: true,
    features: [
      "Everything in Essential",
      "Medication reminders",
      "Family dashboard (unlimited members)",
      "Local service search & live connect",
      "Weekly care summaries",
    ],
  },
  {
    key: "CONCIERGE",
    stripeKey: "concierge",
    name: "Concierge",
    price: "$110/mo",
    features: [
      "Everything in Plus",
      "Medical appointment scheduling (Lily calls for you)",
      "One-time call-back reminders",
      "Lily answers any question — weather, sports, news, anything",
      "Detailed weekly care reports",
    ],
  },
];

const FAMILY_PLANS = [
  {
    key: "ESSENTIAL_FAMILY",
    stripeKey: "essential_family",
    name: "Essential Family",
    price: "$75/mo",
    features: [
      "Everything in Essential — for 2 parents",
      "Daily wellness check-in calls (each parent)",
      "Medication reminders (each parent)",
      "Family dashboard + emergency alerts",
    ],
  },
  {
    key: "PLUS_FAMILY",
    stripeKey: "plus_family",
    name: "Plus Family",
    price: "$130/mo",
    popular: true,
    features: [
      "Everything in Plus — for 2 parents",
      "Family dashboard (unlimited members)",
      "Local service search & live connect",
      "Weekly care summaries",
    ],
  },
  {
    key: "CONCIERGE_FAMILY",
    stripeKey: "concierge_family",
    name: "Concierge Family",
    price: "$180/mo",
    features: [
      "Everything in Concierge — for 2 parents",
      "Medical appointment scheduling (each parent)",
      "One-time call-back reminders (each parent)",
      "Detailed weekly reports (per parent)",
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

  const [planTab, setPlanTab] = useState<"individual" | "family">(
    plan?.includes("FAMILY") ? "family" : "individual"
  );
  const PLANS = planTab === "individual" ? INDIVIDUAL_PLANS : FAMILY_PLANS;
  const ALL_PLANS = [...INDIVIDUAL_PLANS, ...FAMILY_PLANS];

  const [showSwitchConfirm, setShowSwitchConfirm] = useState<string | null>(null);

  async function selectPlan(stripeKey: string) {
    if (stripeKey !== "cancel") {
      setShowSwitchConfirm(stripeKey);
      return;
    }
    await doSelectPlan(stripeKey);
  }

  async function doSelectPlan(stripeKey: string) {
    setShowSwitchConfirm(null);
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

  const normalizedPlan = plan?.replace("COMPLETE_FAMILY", "CONCIERGE_FAMILY").replace("COMPLETE", "CONCIERGE") || plan;
  const currentPlan = ALL_PLANS.find((p) => p.key === normalizedPlan);

  const trialEndDate = trialEnd
    ? new Date(trialEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const confirmPlan = ALL_PLANS.find(p => p.stripeKey === showSwitchConfirm);

  return (
    <div>
      {/* Plan switch confirmation modal */}
      {showSwitchConfirm && confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-navy mb-2">Switch to {confirmPlan.name}?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your plan will switch to <strong>{confirmPlan.name} ({confirmPlan.price})</strong>.
              {status === "trialing"
                ? " Since you're still in your free trial, no charge will occur until your trial ends. You can switch or cancel anytime before then."
                : " The change takes effect at the start of your next billing cycle — your current plan stays active until that date."}
            </p>
            <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-sm mb-5">
              {status === "trialing"
                ? "You're on a free trial — no charge until your trial ends."
                : "No immediate charge. Changes apply at next billing cycle."}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSwitchConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => doSelectPlan(showSwitchConfirm)}
                className="flex-1 bg-teal text-white py-2.5 rounded-full text-sm font-semibold hover:bg-teal-dark">
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}

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
            Free trial — <strong>{Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000))} days remaining</strong> (ends {new Date(trialEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}). No charge until then — cancel anytime.
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

      {/* Individual / Family toggle */}
      <div className="flex mb-4">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setPlanTab("individual")}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              planTab === "individual" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setPlanTab("family")}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              planTab === "family" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"
            }`}
          >
            Family (2 Parents)
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mb-6">
        {PLANS.map((p) => {
          const isCurrent = p.key === normalizedPlan;
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
                {!plan && <div className="text-xs text-gray-400">+ 7-day free trial</div>}
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
                  : status === "trialing" || plan
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
