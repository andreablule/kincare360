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
              oversight. Peace of mind. Starting at $149/month.
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

          {/* Hero illustration placeholder */}
          <div className="hidden md:flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-teal to-navy flex items-center justify-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                className="opacity-80"
              >
                <circle cx="100" cy="70" r="30" fill="white" opacity="0.3" />
                <circle cx="70" cy="130" r="25" fill="white" opacity="0.2" />
                <circle cx="130" cy="130" r="25" fill="white" opacity="0.2" />
                <path
                  d="M100 50c-8 0-15 5-15 13 0 10 15 22 15 22s15-12 15-22c0-8-7-13-15-13z"
                  fill="white"
                  opacity="0.6"
                />
                <circle cx="100" cy="70" r="8" fill="white" opacity="0.4" />
                <rect
                  x="60"
                  y="115"
                  width="80"
                  height="50"
                  rx="10"
                  fill="white"
                  opacity="0.15"
                />
                <text
                  x="100"
                  y="145"
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  opacity="0.5"
                >
                  Family Care
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Licensed &amp; Insured
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              CNA-Backed Care
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Philadelphia Based
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
