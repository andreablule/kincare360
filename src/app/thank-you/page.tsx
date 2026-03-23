import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You | KinCare360",
  description: "Thank you for contacting KinCare360. We'll be in touch within 24 hours.",
};

export default function ThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal/10 text-teal mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">
          Thank you!
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          We&apos;ve received your message. Our team will contact you within 24
          hours to discuss your family&apos;s care needs.
        </p>
        <a
          href="/"
          className="inline-block bg-teal text-white px-8 py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
