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
