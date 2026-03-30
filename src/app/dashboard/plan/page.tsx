"use client";

import { useEffect, useState } from "react";

const PLAN_PRICE_CENTS: Record<string, number> = {
  INDIVIDUAL: 9900,
  FAMILY: 14900,
  // Legacy
  ESSENTIAL: 5000,
  PLUS: 8000,
  CONCIERGE: 11000,
  ESSENTIAL_FAMILY: 7500,
  PLUS_FAMILY: 13000,
  CONCIERGE_FAMILY: 18000,
};

const PLANS = [
  {
    key: "INDIVIDUAL",
    stripeKey: "individual",
    name: "Individual",
    price: "$99/mo",
    features: [
      "Daily wellness check-in calls",
      "Medication reminders",
      "Appointment scheduling (Lily calls for you)",
      "Find & connect to any service",
      "Emergency detection and family alerts",
      "Family dashboard",
      "24/7 access to Lily",
    ],
  },
  {
    key: "FAMILY",
    stripeKey: "family",
    name: "Family (2 Parents)",
    price: "$149/mo",
    features: [
      "Everything included — for 2 parents",
      "Each parent gets their own personalized calls",
      "Separate medication reminders per parent",
      "Appointment scheduling for both parents",
      "Family dashboard with all care info",
      "24/7 access to Lily for both parents",
    ],
  },
];

export default function PlanPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [pendingPlanDate, setPendingPlanDate] = useState<string | null>(null);
  const [patientNames, setPatientNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelingDowngrade, setCancelingDowngrade] = useState(false);

  function fetchPlan() {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan);
        setStatus(data.subscriptionStatus);
        setTrialEnd(data.trialEnd || null);
        setPendingPlan(data.pendingPlan || null);
        setPendingPlanDate(data.pendingPlanDate || null);
        setPatientNames(data.patientNames || []);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchPlan();
  }, []);

  const [showSwitchConfirm, setShowSwitchConfirm] = useState<string | null>(null);

  // Normalize legacy plan names to new ones for display
  function normalizePlan(p: string | null): string | null {
    if (!p) return p;
    const upper = p.toUpperCase();
    if (upper.includes("FAMILY")) return "FAMILY";
    return "INDIVIDUAL";
  }

  const normalizedPlan = normalizePlan(plan);
  const currentPlan = PLANS.find((p) => p.key === normalizedPlan);
  const pendingPlanObj = PLANS.find((p) => p.key === pendingPlan);

  function getPlanLabel(targetStripeKey: string): "upgrade" | "downgrade" | "current" | null {
    if (!normalizedPlan) return null;
    const targetPlanObj = PLANS.find(p => p.stripeKey === targetStripeKey);
    if (!targetPlanObj) return null;
    if (targetPlanObj.key === normalizedPlan) return "current";
    const currentPrice = PLAN_PRICE_CENTS[normalizedPlan] || 0;
    const targetPrice = PLAN_PRICE_CENTS[targetPlanObj.key] || 0;
    return targetPrice > currentPrice ? "upgrade" : "downgrade";
  }

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

  async function cancelPendingDowngrade() {
    setCancelingDowngrade(true);
    try {
      const res = await fetch("/api/plan/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_downgrade" }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingPlan(null);
        setPendingPlanDate(null);
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setCancelingDowngrade(false);
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const trialEndDate = trialEnd
    ? new Date(trialEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const pendingDate = pendingPlanDate
    ? new Date(pendingPlanDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const confirmPlan = PLANS.find(p => p.stripeKey === showSwitchConfirm);
  const confirmLabel = showSwitchConfirm ? getPlanLabel(showSwitchConfirm) : null;

  return (
    <div>
      {/* Plan switch confirmation modal */}
      {showSwitchConfirm && confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-navy mb-2">
              {confirmLabel === "upgrade" ? "Upgrade" : "Switch"} to {confirmPlan.name}?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Your plan will {confirmLabel === "upgrade" ? "be upgraded" : "switch"} to <strong>{confirmPlan.name} ({confirmPlan.price})</strong>.
              {status === "trialing"
                ? " Since you're still in your free trial, no charge will occur until your trial ends. You can switch or cancel anytime before then."
                : confirmLabel === "upgrade"
                ? " The upgrade takes effect immediately. You'll be charged a prorated amount for the remainder of this billing period."
                : " The change takes effect at the end of your current billing period. You'll keep your current plan features until then."}
            </p>
            <div className={`rounded-xl px-4 py-3 text-sm mb-5 ${
              confirmLabel === "upgrade" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
            }`}>
              {status === "trialing"
                ? "You're on a free trial — no charge until your trial ends."
                : confirmLabel === "upgrade"
                ? "Upgrade is immediate with prorated billing."
                : "Downgrade takes effect at end of billing period."}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSwitchConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => doSelectPlan(showSwitchConfirm)}
                className={`flex-1 text-white py-2.5 rounded-full text-sm font-semibold ${
                  confirmLabel === "upgrade" ? "bg-green-600 hover:bg-green-700" : "bg-teal hover:bg-teal-dark"
                }`}>
                {confirmLabel === "upgrade" ? "Confirm Upgrade" : "Confirm Switch"}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-navy mb-2">Plan Management</h1>

      {patientNames.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {patientNames.length > 1 ? "Account Holders" : "Account Holder"}: <span className="font-semibold text-navy">{patientNames.join(" & ")}</span>
        </p>
      )}

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

        {/* Pending downgrade banner */}
        {pendingPlan && pendingPlanObj && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-amber-800">
                Your plan will change to <strong>{pendingPlanObj.name} ({pendingPlanObj.price})</strong>{pendingDate ? ` on ${pendingDate}` : " at the end of your billing period"}.
                You&apos;ll keep your current features until then.
              </div>
              <button
                onClick={cancelPendingDowngrade}
                disabled={cancelingDowngrade}
                className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap disabled:opacity-40"
              >
                {cancelingDowngrade ? "Canceling..." : "Cancel Change"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan picker */}
      <h2 className="text-base font-semibold text-navy mb-3">
        {plan ? "Switch Plan" : "Choose a Plan"}
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mb-6">
        {PLANS.map((p) => {
          const isCurrent = p.key === normalizedPlan;
          const label = getPlanLabel(p.stripeKey);
          return (
            <div
              key={p.key}
              className={`bg-white rounded-2xl border p-5 flex flex-col relative ${
                isCurrent ? "border-teal shadow-sm" : "border-gray-100"
              }`}
            >
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
                    : label === "upgrade"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : label === "downgrade"
                    ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    : "bg-teal text-white hover:bg-teal-dark"
                }`}
              >
                {upgrading === p.stripeKey
                  ? "Redirecting..."
                  : isCurrent
                  ? "Current Plan"
                  : label === "upgrade"
                  ? "Upgrade"
                  : label === "downgrade"
                  ? "Downgrade"
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
