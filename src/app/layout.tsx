import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KinCare360 -- AI-Powered Care Coordination for Aging Parents",
  description:
    "Daily check-ins, medication reminders, and appointment coordination for your aging parent. AI-powered care coordination starting at $99/month. Available nationwide in 18 languages.",
  openGraph: {
    title: "KinCare360 -- AI-Powered Care Coordination for Aging Parents",
    description:
      "Daily check-ins, medication reminders, and appointment coordination for your aging parent. AI-powered care coordination. Available nationwide in 18 languages.",
    url: "https://kincare360.com",
    siteName: "KinCare360",
    type: "website",
    locale: "en_US",
  },
  metadataBase: new URL("https://kincare360.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

