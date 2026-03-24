"use client";

export default function Contact() {
  return (
    <section id="contact" className="bg-white py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
          Ready to get started?
        </h2>
        <p className="text-gray-500 text-lg mb-10">
          Call Lily — our AI concierge — and she'll walk you through everything, answer your questions, and get your loved one set up. Available 24 hours a day, 7 days a week.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
          <a
            href="tel:+18125155252"
            className="flex items-center gap-3 bg-teal text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-teal-dark transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            (812) 515-5252
          </a>
          <a
            href="mailto:hello@kincare360.com"
            className="flex items-center gap-3 border-2 border-teal text-teal px-8 py-4 rounded-full text-lg font-semibold hover:bg-teal hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            hello@kincare360.com
          </a>
        </div>

        <p className="text-gray-400 text-sm">
          Already a member? <a href="/login" className="text-teal font-medium hover:underline">Log in to your dashboard →</a>
        </p>
      </div>
    </section>
  );
}
