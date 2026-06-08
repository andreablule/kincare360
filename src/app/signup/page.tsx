import { Suspense } from "react";
import SignupForm from "./SignupFormClient";

const smsConsentText = "I agree to receive recurring automated SMS/text messages from KinCare360, operated by Son Healthcare Services LLC, about account/service notices and family coordination updates, including daily check-in summaries, family-approved routine reminders, appointment updates, family concern notifications, and time-sensitive non-medical family follow-up notices. Message frequency varies, up to 5 messages/day. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. View our";

function StaticSignupEvidence() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Full Name</label>
          <input type="text" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy text-sm" placeholder="John Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Email address</label>
          <input type="email" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy text-sm" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Create a password</label>
          <input type="password" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy text-sm" placeholder="Minimum 8 characters" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Confirm password</label>
          <input type="password" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy text-sm" placeholder="Re-enter your password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Mobile phone number <span className="font-normal text-gray-400">(optional)</span></label>
          <input type="tel" inputMode="tel" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy text-sm" placeholder="(555) 123-4567" />
          <p className="text-xs text-gray-400 mt-1">Mobile phone number is optional. Provide it only if you want to receive SMS/text updates from KinCare360.</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <input type="checkbox" id="staticSmsConsent" defaultChecked={false} className="mt-1 h-4 w-4 rounded border-gray-300 text-teal" />
          <label htmlFor="staticSmsConsent" className="text-xs text-gray-600 leading-relaxed">
            {smsConsentText}{" "}
            <a href="/terms" className="text-teal underline">Terms</a> and{" "}
            <a href="/privacy" className="text-teal underline">Privacy Policy</a>. KinCare360 is not an emergency, crisis, medical, or in-home care service.
            <span className="block mt-2 font-medium text-navy">You can create an account without providing a mobile phone number and without agreeing to SMS/text messages.</span>
          </label>
        </div>
        <button type="button" disabled className="w-full bg-teal text-white py-3.5 rounded-xl font-semibold opacity-60 text-sm">Create Account & Continue →</button>
        <p className="text-xs text-gray-400 text-center">This SMS consent information is visible for reviewers and non-JavaScript clients. The live form becomes interactive when the page loads.</p>
      </div>
    </div>
  );
}

function SignupSmsEvidenceSection() {
  return (
    <section className="mt-6 rounded-2xl border border-teal/20 bg-teal/5 p-5 text-sm text-navy" aria-labelledby="signup-sms-consent-evidence">
      <h2 id="signup-sms-consent-evidence" className="font-bold text-navy">Optional SMS/text updates during signup</h2>
      <div className="mt-3 space-y-3">
        <div>
          <p className="font-semibold">Mobile phone number <span className="font-normal text-gray-500">(optional)</span></p>
          <p className="text-xs text-gray-600 mt-1">Mobile phone number is optional. Provide it only if you want to receive SMS/text updates from KinCare360.</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <input type="checkbox" defaultChecked={false} aria-label="Optional SMS consent checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-teal" />
          <p className="text-xs text-gray-600 leading-relaxed">
            {smsConsentText}{" "}
            <a href="/terms" className="text-teal underline">Terms</a> and{" "}
            <a href="/privacy" className="text-teal underline">Privacy Policy</a>.
          </p>
        </div>
        <p className="text-xs font-medium text-navy">You can create an account without providing a mobile phone number and without agreeing to SMS/text messages.</p>
      </div>
    </section>
  );
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-28 w-auto mx-auto mb-6" />
          </a>
          <h1 className="text-2xl font-bold text-navy">Start Your Free Trial</h1>
          <p className="text-gray-500 mt-2 text-sm">Create your account to begin your 7-day free trial. No charge until day 8.</p>
        </div>

        <SignupSmsEvidenceSection />

        <div className="mt-6">
          <Suspense fallback={<StaticSignupEvidence />}>
            <SignupForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-teal font-semibold hover:underline">Sign in</a>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Need help? Call <a href="tel:+12727669090" className="text-teal hover:underline">+1 272 766 9090</a>
        </p>
      </div>
    </main>
  );
}
