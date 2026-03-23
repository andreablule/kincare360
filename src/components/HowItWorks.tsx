const steps = [
  {
    number: "1",
    title: "Free Consultation",
    description:
      "We learn about your parent's needs, schedule, and health situation.",
  },
  {
    number: "2",
    title: "Personalized Care Plan",
    description:
      "We build a daily oversight schedule tailored to your family.",
  },
  {
    number: "3",
    title: "Daily Oversight Begins",
    description: "Our coordinators check in every day. You get updates.",
  },
  {
    number: "4",
    title: "Family Stays Informed",
    description:
      "Regular reports and a family dashboard keep everyone aligned.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-16">
          Simple steps to care
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="animate-on-scroll text-center relative">
              {/* Connector line (desktop only) */}
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
