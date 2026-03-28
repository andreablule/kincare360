import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import CTASection from "@/components/CTASection";
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
            "priceRange": "$50-$180/month",
            "openingHours": "Mo-Su 00:00-23:59",
            "sameAs": []
          })
        }}
      />
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Services />
        <Pricing />
        <CTASection />
        <Contact />
      </main>
      <Footer />
      <ScrollObserver />
    </>
  );
}
