export default function Hero() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-navy leading-tight">
              We watch over Mom &mdash; so you don&apos;t have to worry.
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
              KinCare360 provides daily check-ins, medication reminders, and
              appointment coordination for your aging parent. Professional
              oversight. Peace of mind. Starting at $99/month.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="bg-teal text-white px-8 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors"
              >
                Get Started Today &rarr;
              </a>
              <a
                href="#how-it-works"
                className="border-2 border-teal text-teal px-8 py-3 rounded-full font-semibold hover:bg-teal hover:text-white transition-colors"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Hero image */}
          <div className="hidden md:block animate-fade-in">
            <div className="relative w-full max-w-md mx-auto">
              <img
                src="/hero-family.png"
                alt="Adult family member caring for elderly parent at home"
                className="w-full h-[600px] object-cover rounded-3xl shadow-2xl"
              />
              {/* Floating stat card */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Families served</p>
                  <p className="text-lg font-bold text-navy">500+</p>
                </div>
              </div>
              {/* Floating badge top right */}
              <div className="absolute -top-4 -right-4 bg-teal text-white rounded-2xl shadow-lg px-4 py-3 text-center">
                <p className="text-xs font-medium opacity-80">Starting at</p>
                <p className="text-xl font-extrabold">$99<span className="text-sm font-normal">/mo</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              CNA-Backed Care
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Available Nationwide
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              24/7 Family Support
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Family Dashboard Included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
