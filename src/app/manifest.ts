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
    display: 'standalone',
    background_color: settings?.primaryColor || '#ffffff',
    theme_color: settings?.secondaryColor || '#000000',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: iconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png',
        purpose: 'any'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: iconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
