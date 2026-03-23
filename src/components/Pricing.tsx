export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 text-center mb-16">
          Cancel anytime. No contracts. First week free.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Essential */}
          <div className="animate-on-scroll rounded-2xl border-2 border-gray-200 bg-white p-8 flex flex-col">
            <h3 className="text-xl font-bold text-navy">Essential</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-navy">$149</span>
              <span className="text-gray-500">/month</span>
            </div>
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
            <a
              href="#contact"
              className="mt-8 block text-center bg-white border-2 border-teal text-teal px-6 py-3 rounded-full font-semibold hover:bg-teal hover:text-white transition-colors"
            >
              Subscribe Now
            </a>
          </div>

          {/* Premium */}
          <div className="animate-on-scroll rounded-2xl bg-teal p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white text-teal text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-white">Premium</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">$249</span>
              <span className="text-white/70">/month</span>
            </div>
            <p className="mt-2 text-white/80 text-sm">
              Everything in Essential, plus:
            </p>
            <ul className="mt-6 space-y-4 flex-1">
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
            <a
              href="#contact"
              className="mt-8 block text-center bg-white text-teal px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Premium
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
