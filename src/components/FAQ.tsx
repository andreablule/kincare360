"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is Lily a real person?",
    a: "Lily is an AI family check-in assistant designed for warm, simple conversations with seniors. Instead of using a smartphone, computer, app, or web browser, your loved one can simply talk to Lily by phone. She remembers your parent's name, preferences, and daily routine details you choose to share — so every call feels personal and familiar.",
  },
  {
    q: "Why is Lily different from an app or website?",
    a: "Many elderly adults do not want to manage passwords, apps, small screens, or web searches. Lily gives them a voice-first way to ask questions, talk through everyday needs, request help, and keep family informed using a regular phone call.",
  },
  {
    q: "What if my parent doesn't answer?",
    a: "If your parent doesn't pick up, Lily tries again a little later. If she still can't reach them, your family receives a concern notification so someone can check in.",
  },
  {
    q: "Is this a medical service?",
    a: "No — KinCare360 is a non-medical care coordination service, not a medical provider, in-home care agency, or emergency service. Lily helps with daily check-ins, routine reminders, family updates, and everyday coordination. She does not diagnose, treat, provide medical advice, supervise medication, or respond to emergencies.",
  },
  {
    q: "What happens if Lily hears something concerning?",
    a: "KinCare360 is not an emergency, crisis counseling, suicide-prevention, medical, or in-home care service. If a caller shares something suggesting possible immediate harm, self-harm, severe confusion, abuse, exploitation, or another urgent safety concern, Lily may encourage 911, 988, Poison Control, or another appropriate resource and may notify listed family/safety contacts so someone can follow up.",
  },
  {
    q: "Can I listen to the calls?",
    a: "You get transcripts and summaries of every call on your family dashboard. You can read what was discussed, review routine notes, and see family updates in one place.",
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
    q: "Does this work for loved ones who need simple, patient conversations?",
    a: "Yes. Lily is patient, consistent, and easy to talk to. She can keep calls simple, natural, and reassuring for families who want a daily check-in routine. KinCare360 is still non-medical and should not replace professional care when it is needed.",
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
