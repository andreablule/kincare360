import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  verification: {
    google: "cf_IcqWaXVOu0IqvLj-_TW_mkcd9yl3Mmq8ZcEyJnJA",
  },
  title: "KinCare360 — Daily Family Check-In Calls for Aging Parents",
  description: "KinCare360's AI family check-in assistant Lily gives aging parents a simple phone-based way to talk, ask questions, manage routines, and keep family updated — no smartphone, computer, or app required. Starting at $99/month. 7-day free trial.",
  keywords: "elderly care, aging parents, daily check-in calls, senior care, family check-ins, elder care coordination, caregiver support, family dashboard, remote family support",
  openGraph: {
    title: "KinCare360 — Daily Family Check-In Calls for Your Aging Parent",
    description: "Lily gives your loved one a simple voice interface for daily check-ins, routine support, everyday questions, and family updates — no app or computer required. Plans from $99/mo. Free 7-day trial.",
    url: "https://kincare360.com",
    siteName: "KinCare360",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KinCare360 — Daily Family Check-In Calls for Aging Parents",
    description: "AI family check-in assistant Lily lets aging parents talk by phone for daily check-ins, routines, questions, and family updates. No app required. From $99/mo.",
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


