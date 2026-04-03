import { MetadataRoute } from 'next'
import { db } from "@/lib/prisma"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await db.siteSetting.findFirst()

  const iconUrl = settings?.logoUrl || settings?.faviconUrl || '/globe.svg'

  return {
    name: settings?.siteName || 'abcdExamHub',
    short_name: settings?.siteName?.split(' ')[0] || 'ExamHub',
    description: settings?.siteDescription || 'Enterprise Exam Management System',
    start_url: '/',
    display: 'standalone',
    background_color: settings?.primaryColor || '#ffffff',
    theme_color: settings?.primaryColor || '#4f46e5',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
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
