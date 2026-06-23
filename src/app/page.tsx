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
import FAQ from "@/components/FAQ";

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
            "description": "AI-powered phone conversations, daily check-in calls, routine reminders, and family updates for aging parents — no smartphone, computer, or app required.",
            "url": "https://kincare360.com",
            "telephone": "+12727669090",
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
        <FAQ />
        <Pricing />
        {/* Partner Program Banner */}
        <section className="py-16 bg-gradient-to-r from-teal/10 to-navy/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Partner With KinCare360
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Know a family who could benefit from simple phone-based check-ins and non-medical coordination? Our partner program helps families, professionals, and community organizations share KinCare360 responsibly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/partners"
                className="bg-teal text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-teal-dark transition-colors"
              >
                Join the Partner Program →
              </a>
              <a
                href="/login"
                className="border-2 border-teal text-teal px-8 py-3 rounded-full text-lg font-semibold hover:bg-teal hover:text-white transition-colors"
              >
                Already a Member? Refer from Dashboard
              </a>
            </div>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
      <ScrollObserver />
    </>
  );
}
