import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import { TooltipProvider } from '#/components/ui/tooltip'
import { PromoBanner, SiteFooter, SiteHeader } from '#/components/site-header'
import { CF_BEACON_TOKEN, SITE_URL } from '#/lib/site'

import appCss from '../styles.css?url'

const OG_IMAGE = `${SITE_URL}/og-image-v2.jpg`
const TITLE = 'gifdrop: turn any GIF or clip into a WhatsApp sticker'
const DESCRIPTION =
  'Paste an X, TikTok, Instagram or GIPHY link and get an animated WhatsApp sticker. Copy, paste, send. Free, no app.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#fdfcfb' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/` },
      { property: 'og:site_name', content: 'gifdrop' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'gifdrop: Any GIF, into WhatsApp.' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32.png',
      },
      // Google search favicon needs a multiple of 48px
      { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="d3c5d72d-69b2-4445-8fe8-acd10b295b39"
        />
      </head>
      <body>
        <TooltipProvider delayDuration={200}>
          <PromoBanner />
          <SiteHeader />
          {children}
          <SiteFooter />
        </TooltipProvider>
        <Toaster
          position="top-center"
          containerStyle={{ top: 'calc(env(safe-area-inset-top) + 72px)' }}
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#101010',
              border: '1px solid #e9e7e2',
              borderRadius: 999,
              fontSize: 15, fontWeight: 600,
            },
            success: {
              iconTheme: { primary: '#118453', secondary: '#ffffff' },
            },
          }}
        />
        <Scripts />
        {CF_BEACON_TOKEN && (
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })} />
        )}
      </body>
    </html>
  )
}
