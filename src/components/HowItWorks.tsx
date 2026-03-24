const steps = [
  {
    number: "1",
    title: "Call or Sign Up",
    description:
      "Call Lily at (812) 515-5252 or visit kincare360.com to start your 7-day free trial.",
  },
  {
    number: "2",
    title: "Set Up Your Care Plan",
    description:
      "Choose your plan, fill out the intake form, pick your call times, and select your language.",
  },
  {
    number: "3",
    title: "Lily Starts Caring",
    description: "Lily calls your loved one daily — checking in, reminding medications, coordinating appointments.",
  },
  {
    number: "4",
    title: "Family Stays Informed",
    description:
      "Log into your dashboard anytime to see daily summaries, health updates, and care notes.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-16">
          How it works
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="animate-on-scroll text-center relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-0.5 bg-teal/20" />
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal text-white text-2xl font-bold mb-5">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-navy mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
