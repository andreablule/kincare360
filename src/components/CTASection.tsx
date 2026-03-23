export default function CTASection() {
  return (
    <section className="bg-navy py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Start protecting your parent today.
        </h2>
        <p className="text-white/70 text-lg mb-8">
          First week free. No contracts. Cancel anytime.
        </p>
        <a
          href="#contact"
          className="inline-block bg-teal text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-teal-dark transition-colors"
        >
          Schedule a Free Consultation
        </a>
      </div>
    </section>
  );
}
