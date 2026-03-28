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
