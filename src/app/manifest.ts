import { MetadataRoute } from 'next'
import { db } from "@/lib/prisma"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await db.siteSetting.findFirst()

  // Prioritize Logo, then individual favicon.png fallback
  const timestamp = settings?.updatedAt ? new Date(settings.updatedAt).getTime() : Date.now();
  const iconUrl = (settings?.logoUrl || settings?.faviconUrl || '/abcdExamHub/branding/favicon.png') + `?v=${timestamp}`

  return {
    name: settings?.siteName || 'abcdExamHub',
    short_name: settings?.siteName?.split(' ')[0] || 'ExamHub',
    description: settings?.siteDescription || 'Enterprise Exam Management System',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: settings?.primaryColor || '#09090b',
    theme_color: settings?.secondaryColor || '#09090b',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
