export default function CTASection() {
  return (
    <section className="bg-navy py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <img
          src="/lily-avatar.png"
          alt="Lily - KinCare360 AI Care Concierge"
          className="w-24 h-24 rounded-full ring-2 ring-teal object-cover mx-auto mb-6"
        />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Start protecting your parent today.
        </h2>
        <p className="text-white/70 text-lg mb-8">
          7-day free trial. No contracts. Cancel anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:+18125155252"
            className="inline-block bg-teal text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-teal-dark transition-colors"
          >
            Call Lily Now — (812) 515-5252
          </a>
          <a
            href="#pricing"
            className="inline-block border-2 border-white text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-navy transition-colors"
          >
            View Plans
          </a>
        </div>
        <p className="text-white/50 text-sm mt-6">Available 24/7 · No hold times · Speak to Lily instantly</p>
      </div>
    </section>
  );
}
