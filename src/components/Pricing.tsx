"use client";

import { useState } from "react";

function CheckoutButton({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const plans = [
  {
    key: "basic",
    label: "Getting Started",
    name: "Basic",
    price: "$99",
    tagline: "Best for families just getting started",
    features: [
      {
        text: "Daily wellness check-in calls",
        detail: "Lily calls your loved one every day at their preferred time to check on their mood, health, and how they're feeling.",
      },
      {
        text: "Medication reminder calls",
        detail: "Lily calls at each scheduled medication time to remind your loved one to take their medications. Multiple calls per day based on their schedule.",
      },
      {
        text: "Weekly family update",
        detail: "Every week, family members receive an automated summary of how their loved one has been doing — mood trends, medications, any concerns flagged by Lily.",
      },
      {
        text: "Emergency escalation",
        detail: "If your loved one reports an emergency, falls, or serious concern during a call, Lily immediately sends an urgent SMS alert to all family members and advises calling 911.",
      },
    ],
    dark: false,
    popular: false,
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    key: "standard",
    label: "Best Value",
    name: "Standard",
    price: "$199",
    tagline: "Full care coordination for your family",
    features: [
      {
        text: "Everything in Basic",
        detail: "All daily check-in calls, medication reminders, weekly updates, and emergency escalation included.",
      },
      {
        text: "Appointment scheduling & coordination",
        detail: "Your loved one or family can request a doctor appointment through the dashboard or by asking Lily by phone. Lily handles the scheduling, confirms the appointment, and sends reminders.",
      },
      {
        text: "Prescription refill reminders",
        detail: "Lily tracks when medications are due for refill and proactively reminds your loved one — and notifies family members — 3 days before they run out.",
      },
      {
        text: "Family dashboard access",
        detail: "All family members get access to a shared dashboard showing daily call summaries, medication status, mood trends, and care notes — updated after every call.",
      },
    ],
    dark: false,
    popular: true,
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    key: "premium",
    label: "Full Service",
    name: "Premium",
    price: "$299",
    tagline: "Complete hands-off care for complex needs",
    features: [
      {
        text: "Everything in Standard",
        detail: "All check-ins, reminders, scheduling, refill tracking, and family dashboard included.",
      },
      {
        text: "Healthcare coordination",
        detail: "Lily calls doctor offices, specialist clinics, and pharmacies directly on your loved one's behalf — scheduling appointments, requesting prescription refills, following up on lab results or imaging. Just ask Lily by phone or submit a request in the dashboard.",
      },
      {
        text: "Local service concierge",
        detail: "Need a plumber, electrician, pizza delivery, or any local service? Your loved one just calls Lily. She searches nearby businesses, calls them, and connects your loved one directly — so they can speak with the provider, ask about pricing, and decide. Lily remembers who was contacted and tries a different provider if needed.",
      },
      {
        text: "Monthly care summary report",
        detail: "A detailed monthly report delivered to all family members: wellness trends, medications, appointments completed, services used, and any concerns — everything in one place.",
      },
      {
        text: "Full family dashboard",
        detail: "Unlimited family members can be invited to the dashboard. Each gets their own login with role-based access. Managers can update care records and submit requests.",
      },
    ],
    dark: true,
    popular: false,
    cta: "Start Free Trial",
    href: "/register",
  },
];

export default function Pricing() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 text-center mb-2">Cancel anytime. No contracts.</p>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <span className="bg-teal/10 text-teal text-sm font-semibold px-4 py-2 rounded-full">🎁 7-day free trial on all plans — No charge until day 8</span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">✓ Cancel anytime</span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">✓ No contracts</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`animate-on-scroll rounded-2xl border-2 p-7 flex flex-col relative ${
                plan.dark
                  ? "bg-navy border-navy"
                  : plan.popular
                  ? "bg-white border-teal shadow-lg"
                  : "bg-white border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="mb-4 mt-2">
                <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${plan.dark ? "text-white/60 bg-white/10" : "text-teal bg-teal/10"}`}>
                  {plan.label}
                </span>
              </div>

              <h3 className={`text-xl font-bold ${plan.dark ? "text-white" : "text-navy"}`}>{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold ${plan.dark ? "text-white" : "text-navy"}`}>{plan.price}</span>
                <span className={plan.dark ? "text-white/60" : "text-gray-500"}>/month</span>
              </div>
              <p className="text-sm text-teal font-medium mt-1">First 7 days free</p>
              <p className={`text-xs mt-1 ${plan.dark ? "text-white/50" : "text-gray-400"}`}>{plan.tagline}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => {
                  const key = `${plan.key}-${feature.text}`;
                  const isOpen = expanded === key;
                  return (
                    <li key={feature.text} className="text-sm">
                      <button
                        onClick={() => setExpanded(isOpen ? null : key)}
                        className="flex items-start gap-2 w-full text-left group"
                      >
                        <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={`flex-1 ${plan.dark ? "text-white/80" : "text-gray-600"} group-hover:text-teal transition-colors`}>
                          {feature.text}
                        </span>
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""} ${plan.dark ? "text-white/40" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <p className={`mt-2 ml-6 text-xs leading-relaxed ${plan.dark ? "text-white/60" : "text-gray-500"}`}>
                          {feature.detail}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <a
                href={plan.href}
                className={`mt-7 block w-full text-center px-6 py-3 rounded-full font-semibold transition-colors text-sm ${
                  plan.popular
                    ? "bg-teal text-white hover:bg-teal-dark"
                    : plan.dark
                    ? "bg-teal text-white hover:bg-teal-dark"
                    : "bg-white border-2 border-teal text-teal hover:bg-teal hover:text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Questions about which plan is right for you?{" "}
          <a href="tel:+18125155252" className="text-teal hover:underline">Call Lily at (812) 515-5252</a>
          {" "}— she'll help you choose.
        </p>
      </div>
    </section>
  );
}
