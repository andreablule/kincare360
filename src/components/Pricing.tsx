"use client";

import { useState } from "react";

const ESSENTIAL_PRICE_ID = 'price_1TEOk9JlUr03cRD7ZGB5ssyc';
const PREMIUM_PRICE_ID = 'price_1TEOk9JlUr03cRD7QI3I9PvL';

function CheckoutButton({ priceId, className, children }: { priceId: string; className: string; children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again or call (812) 515-5252.');
        setLoading(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Redirecting...' : children}
    </button>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 text-center mb-4">
          Cancel anytime. No contracts.
        </p>
        {/* Free trial badge */}
        <div className="flex justify-center mb-12">
          <span className="bg-teal/10 text-teal text-sm font-semibold px-4 py-2 rounded-full">
            🎉 7-Day Free Trial — No charge until day 8. Cancel anytime.
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Essential */}
          <div className="animate-on-scroll rounded-2xl border-2 border-gray-200 bg-white p-8 flex flex-col">
            <h3 className="text-xl font-bold text-navy">Essential</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-navy">$299</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-teal font-medium mt-1">First 7 days free</p>
            <ul className="mt-8 space-y-4 flex-1">
              {[
                "Daily wellness check-in calls",
                "Medication reminder system",
                "Appointment scheduling & coordination",
                "Weekly family report",
                "Emergency escalation protocol",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton
              priceId={ESSENTIAL_PRICE_ID}
              className="mt-8 block w-full text-center bg-white border-2 border-teal text-teal px-6 py-3 rounded-full font-semibold hover:bg-teal hover:text-white transition-colors disabled:opacity-60"
            >
              Start Free Trial →
            </CheckoutButton>
          </div>

          {/* Premium */}
          <div className="animate-on-scroll rounded-2xl bg-teal p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white text-teal text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-white">Premium</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">$349</span>
              <span className="text-white/70">/month</span>
            </div>
            <p className="text-sm text-white/80 font-medium mt-1">First 7 days free</p>
            <p className="mt-3 text-white/80 text-sm">Everything in Essential, plus:</p>
            <ul className="mt-4 space-y-4 flex-1">
              {[
                "Family dashboard access (all members)",
                "Priority response (same-day callbacks)",
                "Monthly care summary report",
                "Direct coordinator line",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton
              priceId={PREMIUM_PRICE_ID}
              className="mt-8 block w-full text-center bg-white text-teal px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Start Free Trial →
            </CheckoutButton>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Need to manage or cancel your subscription?{' '}
          <a href="mailto:hello@kincare360.com" className="text-teal hover:underline">Contact us</a> or call{' '}
          <a href="tel:+18125155252" className="text-teal hover:underline">(812) 515-5252</a>
        </p>
      </div>
    </section>
  );
}
