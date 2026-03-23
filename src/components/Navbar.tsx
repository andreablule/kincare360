"use client";

import { useState } from "react";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="text-teal"
            >
              <path
                d="M16 4C12 4 8 7 8 12c0 6 8 16 8 16s8-10 8-16c0-5-4-8-8-8z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M16 6c-2.5 0-5 1.5-5 5 0 1.5.5 3 1.5 4.5L16 21l3.5-5.5C20.5 14 21 12.5 21 11c0-3.5-2.5-5-5-5z"
                fill="currentColor"
              />
              <path
                d="M14 10.5c0-1.5 1-2.5 2-3 1 .5 2 1.5 2 3s-1 2.5-2 3.5c-1-1-2-2-2-3.5z"
                fill="white"
              />
            </svg>
            <span className="text-xl font-bold text-teal">KinCare360</span>
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
              href="#contact"
              className="bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-dark transition-colors"
            >
              Get Started
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
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold text-center hover:bg-teal-dark transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
