"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Contact() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      router.push("/thank-you");
    }, 600);
  }

  return (
    <section id="contact" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
            Get in touch
          </h2>
          <p className="text-gray-500 text-center mb-12">
            Fill out the form below and we&apos;ll contact you within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-navy mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-navy mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  placeholder="you@email.com"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-navy mb-2"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                placeholder="(215) 555-0123"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-navy mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent resize-none"
                placeholder="Tell us about your parent's care needs..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              (812) 515-5252
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              hello@kincare360.com
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
