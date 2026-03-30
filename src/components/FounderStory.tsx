export default function FounderStory() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-10">
          Why We Built KinCare360
        </h2>

        <div className="relative bg-gray-50 rounded-2xl p-8 md:p-10">
          {/* Decorative quote mark */}
          <div className="absolute -top-4 left-8 w-8 h-8 bg-teal rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
            </svg>
          </div>

          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              We built KinCare360 because we lived it. Watching an aging parent from a distance,
              wondering if they took their medication, if they made it to their appointment, if
              they&apos;re eating well — it&apos;s a weight that never leaves you. We know what it&apos;s like to
              call every single morning just to hear &ldquo;I&apos;m fine&rdquo; and finally breathe.
            </p>
            <p>
              KinCare360 was built to fill that gap. Lily makes the daily call so families can
              breathe. She reminds medications so nothing gets missed. And she keeps everyone in the
              loop so no one feels left in the dark.
            </p>
            <p className="font-medium text-navy">
              This is not a replacement for family love — it is a tool to extend it.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-navy font-semibold">— The KinCare360 Team</p>
          </div>
        </div>
      </div>
    </section>
  );
}
