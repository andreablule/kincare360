export default function Hero() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-navy leading-tight">
              Daily check-in calls, reminders, and care coordination for your aging parent.
            </h1>
            <p className="mt-4 text-xl text-gray-600 leading-relaxed max-w-lg">
              Lily, our AI concierge, calls your loved one every day &mdash; and keeps your whole family informed.
            </p>
            <p className="mt-3 text-lg text-gray-500 leading-relaxed max-w-lg">
              Automated care coordination. Total peace of mind. Starting at $99/month.
            </p>
            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="bg-teal text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-teal-dark transition-colors shadow-lg"
              >
                Start Free Trial &mdash; Set Up in 5 Minutes &rarr;
              </a>
              <a
                href="#how-it-works"
                className="border-2 border-teal text-teal px-8 py-4 rounded-full font-semibold text-lg hover:bg-teal hover:text-white transition-colors"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-3 text-sm text-gray-400">7-day free trial · No contracts · Cancel anytime</p>

            {/* Lily mobile - visible only on small screens */}
            <div className="mt-8 md:hidden flex justify-center">
              <img
                src="/lily-hero.png"
                alt="Lily - KinCare360 AI Care Concierge"
                className="w-64 h-80 object-cover object-top rounded-3xl shadow-xl"
              />
            </div>
          </div>

          {/* Lily - Hero portrait */}
          <div className="hidden md:block animate-fade-in">
            <div className="relative w-full max-w-md mx-auto">
              <img
                src="/lily-hero.png"
                alt="Lily - KinCare360 AI Care Concierge"
                className="w-full h-[600px] object-cover object-top rounded-3xl shadow-2xl"
              />
              {/* Floating badge bottom left */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Available</p>
                  <p className="text-lg font-bold text-navy">24/7</p>
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

        {/* Trust badges */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Shield - Not medical */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-600">Not a medical or emergency service — care coordination only</p>
            </div>
            {/* Heart - Peace of mind */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-600">Built for family peace of mind</p>
            </div>
            {/* Lock - Privacy */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-600">Private family dashboard — your data stays yours</p>
            </div>
            {/* Check - Trial */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-teal/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-600">7-day free trial · Cancel anytime · No contracts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
