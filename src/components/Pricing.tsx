"use client";

import { useState } from "react";

const BASIC_PRICE_ID = 'price_1TEPOcJlUr03cRD7vm4xB09U';
const STANDARD_PRICE_ID = 'price_1TEPOcJlUr03cRD7ypzyYYif';
const PREMIUM_PRICE_ID = 'price_1TEPOcJlUr03cRD7tVv6DDjY';

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
        <p className="text-gray-500 text-center mb-2">
          Cancel anytime. No contracts.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <span className="bg-teal/10 text-teal text-sm font-semibold px-4 py-2 rounded-full">
            🎉 7-day free trial on all plans — No charge until day 8
          </span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">
            ✅ Cancel anytime
          </span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">
            🚫 No contracts
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Basic */}
          <div className="animate-on-scroll rounded-2xl border-2 border-gray-200 bg-white p-7 flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wide text-teal bg-teal/10 px-3 py-1 rounded-full">Getting Started</span>
            </div>
            <h3 className="text-xl font-bold text-navy">Basic</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-navy">$99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-teal font-medium mt-1">First 7 days free</p>
            <p className="text-xs text-gray-400 mt-1">Best for families just getting started</p>
            <ul className="mt-6 space-y-3 flex-1">
              {[
                "Daily wellness check-in calls",
                "Medication reminders",
                "Weekly family update",
                "Emergency escalation protocol",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <a href="/register" className="mt-7 block w-full text-center bg-white border-2 border-teal text-teal px-6 py-3 rounded-full font-semibold hover:bg-teal hover:text-white transition-colors text-sm">Start Free Trial</a>
          </div>

          {/* Standard */}
          <div className="animate-on-scroll rounded-2xl border-2 border-teal bg-white p-7 flex flex-col relative shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
              Most Popular
            </div>
            <div className="mb-4 mt-2">
              <span className="text-xs font-bold uppercase tracking-wide text-navy bg-navy/10 px-3 py-1 rounded-full">Best Value</span>
            </div>
            <h3 className="text-xl font-bold text-navy">Standard</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-navy">$199</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-teal font-medium mt-1">First 7 days free</p>
            <p className="text-xs text-gray-400 mt-1">Full care coordination for your family</p>
            <ul className="mt-6 space-y-3 flex-1">
              {[
                "Everything in Basic",
                "Appointment scheduling & coordination",
                "Prescription refill reminders",
                "Family reporting dashboard",
                "Bi-weekly family check-in call",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <a href="/register" className="mt-7 block w-full text-center bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm">Start Free Trial</a>
          </div>

          {/* Premium */}
          <div className="animate-on-scroll rounded-2xl border-2 border-gray-200 bg-navy p-7 flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wide text-white/60 bg-white/10 px-3 py-1 rounded-full">Full Service</span>
            </div>
            <h3 className="text-xl font-bold text-white">Premium</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">$299</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-sm text-teal font-medium mt-1">First 7 days free</p>
            <p className="text-xs text-white/50 mt-1">Priority care for complex needs</p>
            <ul className="mt-6 space-y-3 flex-1">
              {[
                "Everything in Standard",
                "Priority same-day response",
                "Full family dashboard (all members)",
                "Monthly care summary report",
                "Priority 24/7 access to Lily",
                "Doctor & pharmacy coordination",
                "Local service concierge — Lily finds, calls, and connects your loved one directly to plumbers, electricians, restaurants, pharmacies, and more. She remembers who was called and tries a different provider if needed.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/80">{item}</span>
                </li>
              ))}
            </ul>
            <a href="/register" className="mt-7 block w-full text-center bg-teal text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm">Start Free Trial</a>
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
