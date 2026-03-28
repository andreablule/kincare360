# Task: SEO - Make KinCare360 Discoverable on Google

## 1. UPDATE META TAGS (src/app/layout.tsx)

Update the metadata export with proper SEO tags:

```
export const metadata = {
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
};
```

## 2. CREATE SITEMAP (src/app/sitemap.ts)

Create a Next.js sitemap:

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://kincare360.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://kincare360.com/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://kincare360.com/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://kincare360.com/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://kincare360.com/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
```

## 3. CREATE ROBOTS.TXT (src/app/robots.ts)

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/', '/intake/'],
    },
    sitemap: 'https://kincare360.com/sitemap.xml',
  }
}
```

## 4. ADD STRUCTURED DATA (JSON-LD) TO HOME PAGE

In src/app/page.tsx, add a script tag with JSON-LD structured data at the top of the page component:

```jsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HealthAndBeautyBusiness",
      "name": "KinCare360",
      "description": "AI-powered daily check-in calls, medication reminders, and care coordination for aging parents.",
      "url": "https://kincare360.com",
      "telephone": "+18125155252",
      "email": "hello@kincare360.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Philadelphia",
        "addressRegion": "PA",
        "addressCountry": "US"
      },
      "priceRange": "$50-$180/month",
      "openingHours": "Mo-Su 00:00-23:59",
      "sameAs": []
    })
  }}
/>
```

## 5. ADD HEADING TAGS FOR SEO

Check that the home page (src/app/page.tsx) has proper H1, H2, H3 hierarchy. The main headline should be an H1. Section headers should be H2. There should only be ONE H1 on the page.

## GIT
Commit: "feat: SEO - meta tags, sitemap, robots.txt, structured data, OG tags"
Push to main.

When completely finished, run this command:
openclaw system event --text "Done: Full SEO setup - meta tags, sitemap, robots.txt, structured data, OpenGraph tags" --mode now
