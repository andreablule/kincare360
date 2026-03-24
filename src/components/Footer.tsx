const footerLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            {/* Logo */}
            <a href="/" className="inline-block mb-4">
              <img
                src="/kincare360-logo.png"
                alt="KinCare360"
                className="h-28 w-auto brightness-0 invert"
              />
            </a>
            <p className="text-white/60 text-sm max-w-xs mb-4">
              Professional care coordination for aging parents.
            </p>
            {/* Clickable phone + email */}
            <div className="flex flex-col gap-2">
              <a href="tel:+18125155252" className="flex items-center gap-2 text-sm text-teal hover:text-white transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (812) 515-5252
              </a>
              <a href="mailto:hello@kincare360.com" className="flex items-center gap-2 text-sm text-teal hover:text-white transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                hello@kincare360.com
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-white/40">
          <p>&copy; 2026 Son Healthcare Services LLC, operating as KinCare360. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
