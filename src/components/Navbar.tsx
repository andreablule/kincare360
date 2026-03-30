"use client";

import { useState } from "react";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "Earn $50/Referral", href: "/partners" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-40">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src="/kincare360-logo.png"
              alt="KinCare360 - Complete Care Coordination for Families"
              className="h-36 w-auto"
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy hover:text-teal transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/login"
              className="text-sm font-medium text-navy hover:text-teal transition-colors"
            >
              Log In
            </a>
            <a
              href="tel:+18125155252"
              className="bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-dark transition-colors"
            >
              Call (812) 515-5252
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-navy"
            >
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-navy hover:text-teal py-2"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-navy hover:text-teal py-2"
            >
              Log In
            </a>
            <a
              href="tel:+18125155252"
              onClick={() => setMobileOpen(false)}
              className="bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold text-center hover:bg-teal-dark transition-colors"
            >
              Call (812) 515-5252
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
