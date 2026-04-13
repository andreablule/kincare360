import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  verification: {
    google: "cf_IcqWaXVOu0IqvLj-_TW_mkcd9yl3Mmq8ZcEyJnJA",
  },
  title: "KinCare360 — AI-Powered Daily Check-In Calls for Aging Parents",
  description: "KinCare360's AI care assistant Lily calls your aging parent every day — checking in, reminding medications, and alerting family if something's wrong. Starting at $50/month. 7-day free trial.",
  keywords: "elderly care, aging parents, daily check-in calls, medication reminders, senior care, AI care assistant, elder care service, remote patient monitoring, caregiver support, family dashboard",
  openGraph: {
    title: "KinCare360 — Daily AI Check-In Calls for Your Aging Parent",
    description: "Lily calls your loved one every day to check in, remind medications, and alert you if something's wrong. Plans from $50/mo. Free 7-day trial.",
    url: "https://kincare360.com",
    siteName: "KinCare360",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KinCare360 — Daily AI Check-In Calls for Aging Parents",
    description: "AI care assistant Lily calls your parent daily. Medication reminders. Emergency alerts. Family dashboard. From $50/mo.",
  },
  alternates: {
    canonical: "https://kincare360.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
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
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}


