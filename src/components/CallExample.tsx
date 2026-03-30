const transcript = [
  { speaker: "Lily", text: "Good morning, Margaret! This is Lily from KinCare360. How are you feeling today?" },
  { speaker: "Margaret", text: "Oh hi Lily! I\u2019m doing okay, my knee is bothering me a bit." },
  { speaker: "Lily", text: "I\u2019m sorry to hear that. Have you taken your morning medications yet?" },
  { speaker: "Margaret", text: "Oh, I almost forgot! Let me take them now." },
  { speaker: "Lily", text: "Great! I\u2019ll check back in with you tomorrow. Take care, Margaret!" },
];

export default function CallExample() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
          What happens during a Lily check-in call?
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          Here&apos;s a real example of how Lily connects with your loved one every day.
        </p>

        <div className="max-w-lg mx-auto">
          {/* Phone frame */}
          <div className="bg-gray-100 rounded-[2rem] p-3 shadow-xl">
            {/* Phone notch */}
            <div className="bg-gray-800 rounded-t-[1.5rem] pt-6 pb-4 px-4">
              <div className="w-20 h-1.5 bg-gray-600 rounded-full mx-auto mb-4" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Lily — KinCare360</p>
                  <p className="text-gray-400 text-xs">Daily check-in call</p>
                </div>
              </div>
            </div>

            {/* Chat area */}
            <div className="bg-white rounded-b-[1.5rem] px-4 py-6 space-y-3">
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.speaker === "Lily" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.speaker === "Lily"
                        ? "bg-teal text-white rounded-bl-sm"
                        : "bg-gray-100 text-gray-700 rounded-br-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post-call summary */}
          <div className="mt-8 bg-navy/5 border border-navy/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-navy">After every call, your family receives a summary:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="bg-white rounded-lg px-3 py-2">
                <span className="font-semibold text-navy">Mood:</span>{" "}
                <span className="text-gray-600">Good</span>
              </div>
              <div className="bg-white rounded-lg px-3 py-2">
                <span className="font-semibold text-navy">Medications:</span>{" "}
                <span className="text-gray-600">Taken after reminder</span>
              </div>
              <div className="bg-white rounded-lg px-3 py-2">
                <span className="font-semibold text-navy">Concern:</span>{" "}
                <span className="text-gray-600">Knee pain — flagged for family review</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
