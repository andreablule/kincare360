export default function AIReassurance() {
  const items = [
    {
      icon: (
        <svg className="w-6 h-6 text-teal" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
      ),
      title: "Warm, human-like voice",
      desc: "Lily speaks naturally and patiently \u2014 designed specifically for conversations with seniors.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-teal" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Every call is reviewable",
      desc: "Families can read full call summaries and transcripts in their private dashboard.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-teal" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      ),
      title: "Built with care experience",
      desc: "KinCare360 was designed by people who understand elderly care from the inside \u2014 not just engineers.",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-12">
          Lily is designed for seniors. Not just any AI.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
