export const metadata = {
  title: "Privacy Policy | KinCare360",
  description: "KinCare360 Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-navy">
      <h1 className="text-3xl font-bold mb-2 text-teal">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-1">Son Healthcare Services LLC, operating as KinCare360</p>
      <p className="text-sm text-gray-400 mb-10">Effective Date: March 2026</p>

      <section className="space-y-8 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Name, email address, and phone number</li>
            <li>Information about your loved one receiving care</li>
            <li>Payment information (processed securely by Stripe — we do not store card details)</li>
            <li>Communications you send us</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Send appointment reminders and care updates via SMS and email</li>
            <li>Process payments and manage your subscription</li>
            <li>Communicate with you about your account and our services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">3. SMS Communications</h2>
          <p>By checking the SMS consent box during signup and providing your phone number, you expressly consent to receive recurring automated SMS messages from KinCare360. These messages include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Daily wellness check-in notifications</li>
            <li>Medication reminder alerts</li>
            <li>Appointment scheduling updates</li>
            <li>Service and account notifications</li>
          </ul>
          <p className="mt-2">Message frequency varies (up to 5 messages per day). Message and data rates may apply. Your consent is not a condition of purchase.</p>
          <p className="mt-2"><strong>To opt out:</strong> Reply STOP to any message at any time. You will receive a confirmation and no further messages.</p>
          <p className="mt-2"><strong>For help:</strong> Reply HELP to any message, or contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a> or <a href="tel:+18125155252" className="text-teal underline">(812) 515-5252</a>.</p>
          <p className="mt-2">Supported carriers include AT&amp;T, T-Mobile, Verizon, and most major US carriers. KinCare360 will never share your phone number with third parties for marketing purposes.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with trusted third-party service providers (such as Stripe for payments and Twilio for SMS) solely to operate our services. These providers are bound by confidentiality obligations.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">5. Data Security</h2>
          <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and contact us immediately if you suspect unauthorized access.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a>.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">7. Cookies</h2>
          <p>Our website may use cookies to improve your browsing experience. You can disable cookies through your browser settings, though some features may not function properly.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">8. Children's Privacy</h2>
          <p>Our services are not directed to children under 13. We do not knowingly collect personal information from children.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of changes by updating the effective date and, for significant changes, via email.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">10. Contact Us</h2>
          <p>Questions about this Privacy Policy? Contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a></p>
        </div>
      </section>
    </main>
  );
}
