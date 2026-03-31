"use client";

import { useState } from "react";

const features = [
  {
    name: "Daily check-in calls",
    detail: "Every day, Lily calls your loved one at their preferred time. She asks how they're feeling, checks on their mood, and makes sure everything is okay. You get a summary after every call — so you always know how Mom or Dad is doing, even from miles away.",
  },
  {
    name: "Medication reminders",
    detail: "Lily calls at each scheduled medication time to remind your parent exactly which pills to take. Multiple reminders per day if needed. No more missed doses, no more guessing if they took their morning meds.",
  },
  {
    name: "Appointment scheduling",
    detail: "Your parent never has to call a doctor's office and sit on hold for 45 minutes again. Lily handles it all — she calls the office, finds available times, schedules the appointment, and confirms it. Before the visit, she reminds your parent. After the visit, she follows up. No hold music. No frustration. No calling the kids for help. Lily does what used to take your parent an entire afternoon in under 5 minutes.",
  },
  {
    name: "Find & connect to any service",
    detail: "Need a plumber? A pharmacy? A ride to the store? Your parent just tells Lily what they need. She searches, finds a local provider, and connects them directly by phone — no apps, no internet needed. Like having a personal assistant on call 24/7.",
  },
  {
    name: "Emergency family alerts",
    detail: "If Lily detects something concerning during a call — confusion, distress, a fall, or a missed check-in — your family is alerted instantly via text and email. Every second counts, and Lily makes sure you know right away.",
  },
  {
    name: "Family dashboard",
    detail: "A private online portal where you and your family can see daily call summaries, health trends, medication tracking, care notes, and more — all in real time. Invite unlimited family members so everyone stays in the loop.",
  },
  {
    name: "24/7 access to Lily",
    detail: "Your parent can call Lily anytime — day or night — at (812) 515-5252. Whether they need help, have a question, feel lonely, or just want to chat, Lily is always there. No hold times, no voicemail, no waiting.",
  },
  {
    name: "Cancel anytime",
    detail: "No contracts, no commitments, no cancellation fees. If KinCare360 isn't right for your family, cancel with one click from your dashboard. We believe you should stay because you love the service, not because you're locked in.",
  },
];

const plans = [
  {
    key: "individual",
    name: "Individual",
    price: "$99",
    desc: "1 parent",
    href: "/signup",
  },
  {
    key: "family",
    name: "Family",
    price: "$149",
    desc: "2 parents — each gets their own calls",
    href: "/signup",
  },
];

export default function Pricing() {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(name: string) {
    setExpanded(expanded === name ? null : name);
  }

  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 text-center mb-8">
          Everything included. No tiers, no upsells. Cancel anytime.
        </p>

        {/* Value anchoring */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className="bg-navy/5 text-navy text-sm font-medium px-4 py-2 rounded-full">
            Less than $3.30/day
          </span>
          <span className="bg-navy/5 text-navy text-sm font-medium px-4 py-2 rounded-full">
            Replaces hours of daily phone calls
          </span>
          <span className="bg-navy/5 text-navy text-sm font-medium px-4 py-2 rounded-full">
            Can help prevent costly ER visits and hospital readmissions
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <span className="bg-teal/10 text-teal text-sm font-semibold px-4 py-2 rounded-full">
            7-day free trial — No charge until day 8
          </span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">
            Cancel anytime
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="rounded-2xl border-2 border-teal bg-white shadow-sm p-7 flex flex-col"
            >
              <h3 className="text-xl font-bold text-navy">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-navy">{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-teal font-medium mt-1">First 7 days free</p>

              <ul className="mt-6 space-y-1 flex-1">
                {features.map((f) => (
                  <li key={f.name}>
                    <button
                      onClick={() => toggle(plan.key + f.name)}
                      className="w-full flex items-start gap-2 text-sm text-gray-600 hover:text-navy transition-colors py-2 text-left group"
                    >
                      <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="flex-1 font-medium group-hover:text-navy">{f.name}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded === plan.key + f.name ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expanded === plan.key + f.name && (
                      <div className="ml-6 mb-3 text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                        {f.detail}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className="mt-7 block w-full text-center px-6 py-3 rounded-full font-semibold transition-colors text-sm bg-teal text-white hover:bg-teal-dark"
              >
                Start Free Trial &mdash; First Call Today
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400">
          Questions?{" "}
          <a href="tel:+18125155252" className="text-teal hover:underline">Call Lily at (812) 515-5252</a>
          {" "}&mdash; she&apos;ll help you get started.
        </p>
      </div>
    </section>
  );
}
