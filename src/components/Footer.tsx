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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                className="text-teal"
              >
                <path
                  d="M16 6c-2.5 0-5 1.5-5 5 0 1.5.5 3 1.5 4.5L16 21l3.5-5.5C20.5 14 21 12.5 21 11c0-3.5-2.5-5-5-5z"
                  fill="currentColor"
                />
                <path
                  d="M14 10.5c0-1.5 1-2.5 2-3 1 .5 2 1.5 2 3s-1 2.5-2 3.5c-1-1-2-2-2-3.5z"
                  fill="#0a1628"
                />
              </svg>
              <span className="text-lg font-bold text-teal">KinCare360</span>
            </div>
            <p className="text-white/60 text-sm max-w-xs">
              Professional care coordination for aging parents.
            </p>
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
          <p>&copy; 2026 KinCare360. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
