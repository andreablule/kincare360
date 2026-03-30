import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import CallExample from "@/components/CallExample";
import WhoItsFor from "@/components/WhoItsFor";
import AIReassurance from "@/components/AIReassurance";
import BeforeAfter from "@/components/BeforeAfter";
import HowItWorks from "@/components/HowItWorks";
import Services from "@/components/Services";
import FounderStory from "@/components/FounderStory";
import Pricing from "@/components/Pricing";

import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ScrollObserver from "@/components/ScrollObserver";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HealthAndBeautyBusiness",
            "name": "KinCare360",
            "description": "AI-powered daily check-in calls, medication reminders, and care coordination for aging parents.",
            "url": "https://kincare360.com",
            "telephone": "+18125155252",
            "email": "hello@kincare360.com",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Philadelphia",
              "addressRegion": "PA",
              "addressCountry": "US"
            },
            "priceRange": "$99-$149/month",
            "openingHours": "Mo-Su 00:00-23:59",
            "sameAs": []
          })
        }}
      />
      <Navbar />
      <main>
        <Hero />
        <FounderStory />
        <Problem />
        <CallExample />
        <WhoItsFor />
        <AIReassurance />
        <BeforeAfter />
        <HowItWorks />
        <Services />
        <Pricing />
        {/* Referral Program Banner */}
        <section className="py-16 bg-gradient-to-r from-teal/10 to-navy/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Earn $50 for Every Referral
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Know someone who could use KinCare360? Refer them and you both get $50.
              Doctors, agencies, influencers, family members — everyone qualifies. No limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/partners"
                className="bg-teal text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-teal-dark transition-colors"
              >
                Join the Referral Program →
              </a>
              <a
                href="/login"
                className="border-2 border-teal text-teal px-8 py-3 rounded-full text-lg font-semibold hover:bg-teal hover:text-white transition-colors"
              >
                Already a Member? Refer from Dashboard
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Refer 2 friends = your monthly plan is essentially free.
            </p>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
      <ScrollObserver />
    </>
  );
}
