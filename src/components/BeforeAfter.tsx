export default function BeforeAfter() {
  const before = [
    "You call Mom 3 times a day just to check in",
    "Medications get missed at least twice a week",
    "Doctor appointments fall through the cracks",
    "You lie awake wondering if she is okay",
    "Family members are out of the loop",
  ];

  const after = [
    "Lily calls every morning \u2014 you get a summary",
    "Medication reminders ensure nothing is missed",
    "Lily schedules and confirms every appointment",
    "Emergency alerts notify you instantly if something is wrong",
    "The whole family sees daily updates on the dashboard",
  ];

  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-12">
          What changes when Lily starts calling
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 md:p-8">
            <h3 className="text-xl font-bold text-red-700 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Before Lily
            </h3>
            <ul className="space-y-3">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-red-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* After */}
          <div className="rounded-2xl border-2 border-teal/30 bg-teal/5 p-6 md:p-8">
            <h3 className="text-xl font-bold text-teal mb-5 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              After Lily
            </h3>
            <ul className="space-y-3">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-navy">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
