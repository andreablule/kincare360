"use client";

import { useState } from "react";

const individualPlans = [
  {
    key: "essential",
    label: "Getting Started",
    name: "Essential",
    price: "$50",
    tagline: "Best for families just getting started",
    features: [
      {
        text: "Daily wellness check-in calls",
        detail: "Lily calls your loved one every day at their preferred time to check on their mood, health, and how they're feeling.",
      },
      {
        text: "Medication reminders (up to 2x/day)",
        detail: "Lily calls at scheduled medication times to remind your loved one to take their medications — up to twice per day.",
      },
      {
        text: "24/7 access to Lily (call anytime)",
        detail: "Your loved one can call Lily any time of day or night — whether they need someone to talk to, have a question, or need help.",
      },
      {
        text: "Emergency detection and family alerts",
        detail: "If your loved one reports a fall, injury, or emergency during a call, Lily immediately sends SMS and email alerts to all family members.",
      },
    ],
    dark: false,
    popular: false,
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    key: "plus",
    label: "Best Value",
    name: "Plus",
    price: "$80",
    tagline: "Full care coordination for your family",
    features: [
      {
        text: "Everything in Essential",
        detail: "All daily check-in calls, medication reminders, 24/7 Lily access, and emergency alerts included.",
      },
      {
        text: "Unlimited medication reminders",
        detail: "No limit on daily medication reminders — Lily calls as many times as needed throughout the day to match your loved one's medication schedule.",
      },
      {
        text: "Family dashboard access",
        detail: "All family members get access to a shared dashboard showing daily call summaries, medication status, mood trends, and care notes — updated after every call.",
      },
      {
        text: "Appointment scheduling (Lily calls providers)",
        detail: "Your loved one or family can request a doctor appointment. Lily calls the provider's office, schedules it, and confirms the details back.",
      },
      {
        text: "Weekly care summaries",
        detail: "Every week, family members receive an automated summary of how their loved one has been doing — mood trends, medications, appointments, and any concerns.",
      },
    ],
    dark: false,
    popular: true,
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    key: "complete",
    label: "Full Service",
    name: "Complete",
    price: "$110",
    tagline: "Complete hands-off care with full concierge",
    features: [
      {
        text: "Everything in Plus",
        detail: "All check-ins, unlimited reminders, scheduling, family dashboard, and weekly summaries included.",
      },
      {
        text: "Full concierge service (Lily handles ANY call)",
        detail: "Need a plumber, pharmacy refill, restaurant reservation, or any service? Your loved one just asks Lily. She finds the provider, makes the call, and handles everything.",
      },
      {
        text: "Detailed weekly care reports",
        detail: "Comprehensive weekly reports delivered to all family members: wellness trends, mood analysis, medication adherence, appointments, services used, and any concerns.",
      },
      {
        text: "Priority support",
        detail: "Priority response times and dedicated support for any questions or issues with your loved one's care.",
      },
      {
        text: "Custom check-in scheduling",
        detail: "Fully customizable check-in schedule — choose specific days, times, and frequency that work best for your loved one's routine.",
      },
    ],
    dark: true,
    popular: false,
    cta: "Start Free Trial",
    href: "/register",
  },
];

const familyPlans = [
  {
    key: "essential_family",
    label: "Getting Started",
    name: "Essential Family",
    price: "$75",
    tagline: "Care for both parents under one plan",
    features: [
      {
        text: "Everything in Essential — for 2 parents",
        detail: "Each parent gets their own personalized daily check-ins and medication reminders. Mom might get her call at 9 AM and Dad at 10 AM — fully individualized.",
      },
      {
        text: "Daily wellness check-in calls (each parent)",
        detail: "Lily calls each parent separately at their preferred time to check on mood, health, and how they're feeling.",
      },
      {
        text: "Medication reminders (up to 2x/day each)",
        detail: "Each parent gets their own medication reminder schedule — up to twice per day per parent.",
      },
      {
        text: "24/7 access to Lily + emergency alerts",
        detail: "Both parents can call Lily anytime. Emergency detection and family alerts active for both.",
      },
    ],
    dark: false,
    popular: false,
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    key: "plus_family",
    label: "Best Value",
    name: "Plus Family",
    price: "$130",
    tagline: "Full coordination for both parents",
    features: [
      {
        text: "Everything in Plus — for 2 parents",
        detail: "All Plus features for both parents: unlimited reminders, dashboard, appointment scheduling, and weekly summaries.",
      },
      {
        text: "Unlimited medication reminders (each parent)",
        detail: "No limits — each parent gets as many daily medication reminders as they need.",
      },
      {
        text: "Family dashboard for both parents",
        detail: "See check-in history, medication tracking, and care notes for both parents in one dashboard.",
      },
      {
        text: "Appointment scheduling + weekly summaries",
        detail: "Lily schedules appointments for both parents and sends combined weekly care summaries to the family.",
      },
    ],
    dark: false,
    popular: true,
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    key: "complete_family",
    label: "Full Service",
    name: "Complete Family",
    price: "$180",
    tagline: "Complete concierge care for both parents",
    features: [
      {
        text: "Everything in Complete — for 2 parents",
        detail: "Full concierge service for both parents. Each gets individualized care, detailed reports, and priority support.",
      },
      {
        text: "Full concierge for each parent",
        detail: "Lily handles any call for either parent — doctors, pharmacies, restaurants, services, anything they need.",
      },
      {
        text: "Detailed weekly reports (per parent)",
        detail: "Separate detailed weekly care reports for each parent, plus a combined family overview.",
      },
      {
        text: "Priority support + custom scheduling",
        detail: "Priority response and fully customizable check-in schedules for both parents.",
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
  const [tab, setTab] = useState<"individual" | "family">("individual");

  const plans = tab === "individual" ? individualPlans : familyPlans;

  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 text-center mb-4">Cancel anytime. No contracts.</p>

        {/* Individual / Family toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setTab("individual")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === "individual" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setTab("family")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === "family" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-navy"
              }`}
            >
              Family (2 parents)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <span className="bg-teal/10 text-teal text-sm font-semibold px-4 py-2 rounded-full">7-day free trial on all plans — No charge until day 8</span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">Cancel anytime</span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">No contracts</span>
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
          {" "}— she&apos;ll help you choose.
        </p>
      </div>
    </section>
  );
}
