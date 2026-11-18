import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '#/components/ui/sidebar'
import { TooltipProvider } from '#/components/ui/tooltip'
import { AppSidebar, pageTitle } from '#/components/app-sidebar'

import appCss from '../styles.css?url'

// absolute URLs: WhatsApp/X crawlers don't resolve relative og:image paths
const SITE_URL = 'https://gifdrop.farirai.workers.dev'
const OG_IMAGE = `${SITE_URL}/og-image.jpg`
const TITLE = 'gifdrop: send any GIF to WhatsApp'
const DESCRIPTION = 'Paste an X post or GIPHY link, send it to WhatsApp as a real GIF, then turn it into an animated sticker.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#09090b' },
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
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <html lang="en" className="dark">
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
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0 bg-background">
              <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b border-[#1f1f22] bg-background/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur sm:px-4">
                <SidebarTrigger className="size-10 text-muted-foreground md:size-7" />
                <span className="h-5 w-px bg-border" aria-hidden />
                <p className="truncate pl-1 font-mono text-xs text-muted-foreground">{pageTitle(pathname)}</p>
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <Toaster
          position="top-center"
          containerStyle={{ top: 'calc(env(safe-area-inset-top) + 64px)' }}
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid #27272a',
              borderRadius: 6,
              fontSize: 13,
            },
            success: { iconTheme: { primary: '#3ecf7a', secondary: '#04170c' } },
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}
