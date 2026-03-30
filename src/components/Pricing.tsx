"use client";

const features = [
  "Daily check-in calls",
  "Medication reminders",
  "Appointment scheduling",
  "Find & connect to any service",
  "Emergency family alerts",
  "Family dashboard",
  "24/7 access to Lily",
  "Cancel anytime",
];

const plans = [
  {
    key: "individual",
    name: "Individual",
    price: "$99",
    desc: "1 parent",
    href: "/register",
  },
  {
    key: "family",
    name: "Family",
    price: "$149",
    desc: "2 parents — each gets their own calls",
    href: "/register",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 text-center mb-8">
          Everything included. No tiers, no upsells. Cancel anytime.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <span className="bg-teal/10 text-teal text-sm font-semibold px-4 py-2 rounded-full">
            7-day free trial — No charge until day 8
          </span>
          <span className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">
            No contracts
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

              <ul className="mt-6 space-y-3 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className="mt-7 block w-full text-center px-6 py-3 rounded-full font-semibold transition-colors text-sm bg-teal text-white hover:bg-teal-dark"
              >
                Start 7-Day Free Trial
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
