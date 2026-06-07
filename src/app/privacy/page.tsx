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
            <li>Send appointment, routine reminder, family update, and account messages via SMS and email</li>
            <li>Process payments and manage your subscription</li>
            <li>Communicate with you about your account and our services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">3. SMS Communications</h2>
          <p>Account owners may consent during signup/intake. Family members provide their own consent on the public Family SMS Consent page at <a href="https://www.kincare360.com/family-consent" className="text-teal underline">https://www.kincare360.com/family-consent</a> after the account owner adds them to the family profile. By submitting the applicable consent form and providing your phone number, you expressly consent to receive recurring automated SMS messages from KinCare360. These messages include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Daily family check-in notifications</li>
            <li>Family-approved routine reminder notifications</li>
            <li>Appointment and everyday coordination updates</li>
            <li>Service and account notifications</li>
            <li>Family concern notifications, urgent safety concern notices, and daily summaries for loved ones you are connected to</li>
          </ul>
          <p className="mt-2">Message frequency varies (up to 5 messages per day). Message and data rates may apply. Your consent is not a condition of purchase.</p>
          <p className="mt-2"><strong>To opt out:</strong> Reply STOP to any message at any time. You will receive a confirmation and no further messages.</p>
          <p className="mt-2"><strong>For help:</strong> Reply HELP to any message, or contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a> or <a href="tel:+12727669090" className="text-teal underline">+1 272 766 9090</a>.</p>
          <p className="mt-2">Supported carriers include AT&amp;T, T-Mobile, Verizon, and most major US carriers. KinCare360 will never sell, rent, share, or distribute your mobile phone number or SMS opt-in data to third parties or affiliates for marketing or promotional purposes.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with trusted third-party service providers (such as Stripe for payments and Telnyx or another telecommunications provider for SMS) solely to operate our services. These providers are bound by confidentiality obligations.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">5. Urgent Safety Concern Notifications</h2>
          <p>KinCare360 is not an emergency, crisis counseling, suicide-prevention, medical, or in-home care service. However, if a caller shares information suggesting possible immediate harm, self-harm, abuse, neglect, severe confusion, exploitation, or another urgent safety concern, KinCare360 may use call information and profile details to notify listed family/safety contacts and encourage the caller to contact 911, 988, Poison Control, or another appropriate human support resource.</p>
          <p className="mt-2">These notifications do not mean Lily verified an emergency or that KinCare360 can confirm what happened. They mean the caller shared something concerning and a family/safety contact should follow up.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">6. Data Security</h2>
          <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and contact us immediately if you suspect unauthorized access.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">7. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a>.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">8. Cookies</h2>
          <p>Our website may use cookies to improve your browsing experience. You can disable cookies through your browser settings, though some features may not function properly.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">9. Children&apos;s Privacy</h2>
          <p>Our services are not directed to children under 13. We do not knowingly collect personal information from children.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of changes by updating the effective date and, for significant changes, via email.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">11. Contact Us</h2>
          <p>Questions about this Privacy Policy? Contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a></p>
        </div>
      </section>
    </main>
  );
}
