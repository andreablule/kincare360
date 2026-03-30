import Image from "next/image";

export default function FounderStory() {
  return (
    <section className="bg-white py-16 md:py-24" id="founder">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/andrea-founder.png"
                alt="Andrea — Founder of KinCare360"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 256px, 320px"
                priority
              />
            </div>
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
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 tracking-wide">
                Foreign Medical Graduate &bull; Healthcare Experience &bull; Elderly Care Focus
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
