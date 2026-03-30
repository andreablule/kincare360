import Image from "next/image";

export default function FounderStory() {
  return (
    <section className="bg-gray-50 py-20 md:py-28" id="founder">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
          {/* Photo + Name */}
          <div className="flex-shrink-0 text-center">
            <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
              <Image
                src="/andrea-founder.png"
                alt="Andrea Lule — Founder of KinCare360"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 224px, 288px"
                priority
              />
            </div>
            <p className="text-lg font-semibold text-navy mt-4">Andrea Lule</p>
            <p className="text-sm text-teal font-medium">Founder, KinCare360</p>
          </div>

          {/* Story */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
              Why I Built KinCare360
            </h2>

            <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
              <p>
                Hi, I&apos;m <span className="font-semibold text-navy">Andrea</span>.
              </p>
              <p>
                I&apos;m a foreign medical graduate with hands-on experience working with
                elderly patients and hospital systems in the U.S.
              </p>
              <p>
                Over the years, I&apos;ve seen the same problem again and again — families
                doing their best, but things still fall through the cracks. Missed
                medications. Missed appointments. Constant worry.
              </p>
              <p>
                I built KinCare360 to solve that.
              </p>
              <p>
                Not as another app — but as a reliable system families can count on
                every single day.
              </p>
              <p className="font-medium text-navy text-xl">
                Because peace of mind shouldn&apos;t depend on how often you can call.
              </p>
              <p className="italic text-navy mt-2">
                This is something I trust with my own family.
              </p>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
}
