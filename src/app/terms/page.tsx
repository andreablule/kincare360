export const metadata = {
  title: "Terms of Service | KinCare360",
  description: "KinCare360 Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-navy">
      <h1 className="text-3xl font-bold mb-2 text-teal">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-1">Son Healthcare Services LLC, operating as KinCare360</p>
      <p className="text-sm text-gray-400 mb-10">Effective Date: March 2026</p>

      <section className="space-y-8 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using KinCare360's services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">2. Description of Services</h2>
          <p>KinCare360 provides remote care coordination services including daily check-ins, medication reminders, appointment scheduling, and family communication support for elderly individuals and their families.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">3. Eligibility</h2>
          <p>Our services are available to individuals 18 years of age or older. By using our services, you represent that you meet this requirement.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">4. Subscriptions and Payments</h2>
          <p>KinCare360 offers monthly subscription plans. Payments are processed securely through Stripe. Subscriptions automatically renew each month unless cancelled. You may cancel at any time before your next billing date.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">5. Cancellation and Refunds</h2>
          <p>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing cycle. Refunds are evaluated on a case-by-case basis. Please contact us at support@kincare360.com for assistance.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">6. Limitations of Service</h2>
          <p>KinCare360 is a care coordination and support service. We are not a licensed medical provider and do not provide medical advice, diagnosis, or treatment. In case of a medical emergency, call 911 immediately.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">7. Privacy</h2>
          <p>Your use of KinCare360 is also governed by our <a href="/privacy" className="text-teal underline">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">8. Limitation of Liability</h2>
          <p>KinCare360 shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount paid by you in the three months prior to the claim.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">9. Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time. We will notify you of significant changes via email or a notice on our website. Continued use after changes constitutes acceptance.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">10. Contact Us</h2>
          <p>Questions about these Terms? Reach us at <a href="mailto:support@kincare360.com" className="text-teal underline">support@kincare360.com</a></p>
        </div>
      </section>
    </main>
  );
}
