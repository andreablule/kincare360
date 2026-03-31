"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is Lily a real person?",
    a: "Lily is an AI care concierge designed specifically for seniors. She has a warm, natural voice and infinite patience. She remembers your parent's name, medications, preferences, and history — so every call feels personal and familiar.",
  },
  {
    q: "What if my parent doesn't answer?",
    a: "If your parent doesn't pick up, Lily tries again a little later. If she still can't reach them, your family is notified immediately so you can check in. No missed call goes unnoticed.",
  },
  {
    q: "Is this a medical service?",
    a: "No — KinCare360 is a care coordination service, not a medical provider. Lily helps with daily check-ins, medication reminders, appointment scheduling, and connecting to services. She does not diagnose, treat, or provide medical advice.",
  },
  {
    q: "Can I listen to the calls?",
    a: "You get full transcripts and summaries of every call on your family dashboard. You can read exactly what was discussed, see mood tracking, medication compliance, and any concerns flagged — all in real time.",
  },
  {
    q: "What happens after the free trial?",
    a: "After your 7-day free trial, your selected plan auto-charges monthly. You can cancel anytime before the trial ends and you won't be charged a penny.",
  },
  {
    q: "How do I cancel?",
    a: "Cancel anytime — by email, phone, or one click from your dashboard. Cancellation is instant, no hoops to jump through, no retention calls, no hassle.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your data is never sold to third parties. All information is encrypted in transit and at rest. We follow HIPAA-informed privacy practices to keep your family's information safe.",
  },
  {
    q: "Does this work for dementia patients?",
    a: "Yes. Lily is patient, adaptive, and never frustrated. She adjusts her pace, repeats information gently, and keeps calls simple and reassuring. Many families caring for loved ones with cognitive decline find Lily especially helpful.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Everything you need to know about KinCare360 and Lily.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm md:text-base font-semibold text-navy pr-4">
                  {faq.q}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
