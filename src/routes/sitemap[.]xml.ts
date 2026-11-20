import { createFileRoute } from '@tanstack/react-router'
import { POSTS } from '#/content/posts'
import { SITE_URL } from '#/lib/site'

const PAGES = ['/', '/tiktok', '/instagram', '/twitter-video-downloader', '/tiktok-video-downloader', '/instagram-video-downloader', '/help', '/blog', ...POSTS.map((p) => `/blog/${p.slug}`)]

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n')}\n</urlset>\n`,
          { headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' } },
        ),
    },
  },
})
