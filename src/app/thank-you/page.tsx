"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ThankYouContent() {
  const params = useSearchParams();
  const booked = params.get("booked") === "true";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal/10 text-teal mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">
          {booked ? "Appointment Confirmed!" : "Thank you!"}
        </h1>
        <p className="text-gray-600 text-lg mb-4">
          {booked
            ? "Your appointment has been booked successfully. You'll receive a confirmation text message shortly."
            : "We've received your message. Our team will contact you within 24 hours to discuss your family's care needs."}
        </p>
        {booked && (
          <p className="text-gray-500 text-sm mb-6">
            Didn&apos;t get a text? Call or text us at{" "}
            <a href="tel:+18125155252" className="text-teal font-medium">(812) 515-5252</a>
          </p>
        )}
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

export default function ThankYou() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}
