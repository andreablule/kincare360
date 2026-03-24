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

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>⚠️ Important Notice:</strong> KinCare360 is a care coordination and administrative support service only. We are NOT a licensed medical provider, healthcare facility, or emergency service. Nothing provided by KinCare360 constitutes medical advice, diagnosis, or treatment.
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using KinCare360's services, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, please do not use our services.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">2. Description of Services</h2>
          <p>KinCare360 provides <strong>non-medical care coordination services</strong> including:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Daily wellness check-in phone calls (non-clinical)</li>
            <li>Medication reminder notifications (reminders only — not medical supervision)</li>
            <li>Appointment scheduling and coordination assistance</li>
            <li>Communication and reporting to family members</li>
            <li>Administrative support for healthcare navigation</li>
          </ul>
          <p className="mt-3">KinCare360 staff are <strong>not licensed medical professionals</strong> and do not provide clinical assessments, medical diagnoses, or healthcare treatment of any kind.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">3. NOT a Medical Service — No Medical Advice</h2>
          <p>KinCare360 expressly does <strong>NOT</strong> provide:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Medical advice, diagnosis, or treatment</li>
            <li>Clinical assessments or health evaluations</li>
            <li>Nursing, home health aide, or skilled nursing services</li>
            <li>Emergency medical services or crisis intervention</li>
            <li>Medication administration or supervision</li>
            <li>Mental health counseling or therapy</li>
          </ul>
          <p className="mt-3">Any health-related information shared by KinCare360 is for <strong>informational and coordination purposes only</strong> and does not replace the advice of a licensed healthcare professional. Always consult a qualified physician or healthcare provider for medical decisions.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">4. Emergency Services Disclaimer</h2>
          <p className="font-semibold text-red-600">KinCare360 is NOT an emergency service.</p>
          <p className="mt-2">In the event of a medical emergency, call <strong>911</strong> immediately. Do not rely on KinCare360 for emergency response. KinCare360 cannot guarantee response times and is not equipped to handle medical emergencies. By using our services, you acknowledge that KinCare360 shall have no liability for delays in communication or inability to respond to emergencies.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">5. HIPAA & Privacy of Health Information</h2>
          <p>KinCare360 is a care coordination service and functions as a <strong>Business Associate</strong> where applicable under HIPAA. We handle personal health information with care and implement reasonable administrative, technical, and physical safeguards.</p>
          <p className="mt-2">However, KinCare360 is <strong>not a Covered Entity</strong> under HIPAA and does not guarantee full HIPAA compliance for all communications. By using our services, you consent to sharing relevant health information with KinCare360 staff solely for coordination purposes.</p>
          <p className="mt-2">We will never sell your health information. Information shared is used only to coordinate the care services you have requested.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">6. Subscriptions, Free Trial & Payments</h2>
          <p>KinCare360 offers a <strong>7-day free trial</strong>. Your payment method will not be charged until the trial period ends. After 7 days, your subscription will automatically renew monthly at the plan rate you selected unless cancelled before the trial ends.</p>
          <p className="mt-2">Payments are processed securely by Stripe. KinCare360 does not store credit card information.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">7. Cancellation & Refunds</h2>
          <p>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing cycle. To cancel, contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a> or call <a href="tel:+18125155252" className="text-teal underline">(812) 515-5252</a>. Refunds are evaluated on a case-by-case basis.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Son Healthcare Services LLC, operating as KinCare360, shall not be liable for:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Any medical outcomes, health deterioration, or injury</li>
            <li>Missed medications or medical appointments</li>
            <li>Failure to detect a medical emergency</li>
            <li>Any indirect, incidental, special, or consequential damages</li>
            <li>Damages exceeding the amount paid to KinCare360 in the 30 days prior to the claim</li>
          </ul>
          <p className="mt-3">You agree that KinCare360 is a supplemental support service and is not a substitute for professional medical care, in-home care, or emergency services.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">9. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Son Healthcare Services LLC, its officers, employees, and agents from any claims, damages, or expenses (including attorney fees) arising from your use of our services, your violation of these Terms, or your reliance on KinCare360 communications as medical advice.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">10. SMS Communications</h2>
          <p>By providing your phone number, you consent to receive SMS messages from KinCare360 for appointment reminders, care updates, and service notifications. Message and data rates may apply. Reply <strong>STOP</strong> at any time to unsubscribe.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">11. Governing Law</h2>
          <p>These Terms shall be governed by the laws of the Commonwealth of Pennsylvania, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Philadelphia County, Pennsylvania.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">12. Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time. Continued use of our services after changes constitutes acceptance of the new Terms.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-navy mb-2">13. Contact Us</h2>
          <p>Questions? Contact us at <a href="mailto:hello@kincare360.com" className="text-teal underline">hello@kincare360.com</a> or <a href="tel:+18125155252" className="text-teal underline">(812) 515-5252</a></p>
        </div>

      </section>
    </main>
  );
}
