import { Link, useLocation } from '@tanstack/react-router'
import { PixelarticonsDownload } from '#/components/icons/pixelarticons/download'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '#/components/ui/dropdown-menu'
import { FITMYCV_URL } from '#/lib/site'
import { cn } from '#/lib/utils'

// every label says what the page does: "TikTok" alone could be a downloader or a sticker maker
export const TOOLS = [
  {
    label: 'Download videos',
    links: [
      { title: 'X video downloader', url: '/twitter-video-downloader' },
      { title: 'TikTok video downloader', url: '/tiktok-video-downloader' },
      { title: 'Instagram video downloader', url: '/instagram-video-downloader' },
    ],
  },
  {
    label: 'Make stickers',
    links: [
      { title: 'TikTok to sticker', url: '/tiktok', hash: 'make' },
      { title: 'Instagram to sticker', url: '/instagram', hash: 'make' },
    ],
  },
] as const

export const NAV = [
  { title: 'Blog', url: '/blog' },
  { title: 'How it works', url: '/help' },
  { title: 'My stickers', url: '/history' },
] as const

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* pixel droplet on a 12x12 grid, so it stays crisp at small sizes; public/favicon.svg uses the same shape */}
      <span className="grid size-10 -rotate-6 place-items-center rounded-xl bg-brand shadow-[2px_2px_0_var(--foreground)]">
        <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden className="size-5 rotate-6">
          <path className="fill-brand-ink" d="M5 0h2v2h1v2h1v1h1v2h1v3h-1v1h-1v1h-6v-1h-1v-1h-1v-3h1v-2h1v-1h1v-2h1z" />
          <path className="fill-brand" d="M5 5h1v1h1v1h1v1h-1v1h-1v1h-1z" />
        </svg>
      </span>
      <span className="font-display text-[22px] font-extrabold tracking-[-0.04em] text-foreground">
        gif<span className="bg-[linear-gradient(transparent_60%,var(--brand)_60%)]">drop</span>
      </span>
    </span>
  )
}

const pill = 'flex h-11 items-center gap-2 rounded-full border-2 px-4 text-[15px] font-semibold transition'
const navLink = 'text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground'
// one panel look for the desktop dropdown and the phone menu
const menuPanel = 'rounded-3xl border border-border bg-card p-2 shadow-[0_16px_40px_-12px_rgb(16_16_16/0.25)]'
const menuHeading = 'px-4 pt-3 pb-1 font-mono text-[11px] font-medium tracking-wider text-dim uppercase'

// cross-promo for fitmycv; utm tags in FITMYCV_URL let fitmycv's analytics count these clicks
export function PromoBanner() {
  return (
    <a
      href={FITMYCV_URL}
      target="_blank"
      rel="noopener"
      className="group block bg-foreground px-4 py-2.5 text-center text-[14px] leading-snug text-background pt-[calc(env(safe-area-inset-top)+0.625rem)]"
    >
      Hate rewriting your CV and cover letter for every job?{' '}
      <span className="font-semibold whitespace-nowrap text-brand underline decoration-2 underline-offset-4 group-hover:no-underline">
        Try FitMyCV free →
      </span>
    </a>
  )
}

function FreeTools() {
  const path = useLocation({ select: (l) => l.pathname })
  const here = TOOLS.some((g) => g.links.some((l) => l.url === path))

  return (
    // not modal: a site menu shouldn't lock the page from scrolling while it's open
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={cn(navLink, 'group flex items-center gap-1.5 outline-none focus-visible:underline data-[state=open]:text-foreground', here && 'font-semibold text-foreground')}>
        Free tools
        <span aria-hidden className="mb-1 size-2 rotate-45 border-r-2 border-b-2 border-current transition-transform group-data-[state=open]:mt-1.5 group-data-[state=open]:mb-0 group-data-[state=open]:rotate-[225deg]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={14} className={cn(menuPanel, 'w-72')}>
        {TOOLS.map((group, i) => (
          <div key={group.label}>
            {i > 0 && <DropdownMenuSeparator className="mx-2 my-2" />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className={menuHeading}>{group.label}</DropdownMenuLabel>
              {group.links.map((l) => (
                <DropdownMenuItem key={l.url} asChild className="cursor-pointer rounded-2xl px-4 py-2.5 text-[15px] font-medium focus:bg-muted data-[status=active]:bg-brand-soft data-[status=active]:font-semibold">
                  <Link to={l.url} hash={'hash' in l ? l.hash : undefined}>{l.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SiteHeader() {
  const closeMenu = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.closest('details')?.removeAttribute('open')
  const mobileLink = 'rounded-2xl px-4 py-3 text-[17px] font-medium hover:bg-muted data-[status=active]:bg-brand-soft data-[status=active]:font-semibold'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-2 px-4 sm:gap-8 sm:px-6">
        <Link to="/" aria-label="gifdrop home" className="mr-auto md:mr-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="mr-auto hidden items-center gap-6 md:flex">
          <FreeTools />
          {NAV.map((n) => (
            <Link key={n.url} to={n.url} className={navLink}>
              {n.title}
            </Link>
          ))}
        </nav>
        <Link to="/history" className={`${pill} hidden border-border bg-card hover:border-foreground sm:flex md:hidden`}>
          My stickers
        </Link>
        <Link to="/" hash="make" className={`${pill} border-transparent bg-brand shadow-[2px_2px_0_var(--foreground)] hover:shadow-[4px_4px_0_var(--foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}>
          Make <PixelarticonsDownload className="size-4" />
        </Link>
        {/* phones: native disclosure menu, no JS; closes on navigation because the page re-renders */}
        <details className="group relative md:hidden">
          <summary aria-label="Menu" className="grid size-11 cursor-pointer list-none place-items-center rounded-2xl border-2 border-border bg-card [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="grid w-5 gap-1.5">
              <span className="h-0.5 rounded bg-foreground" />
              <span className="h-0.5 rounded bg-foreground" />
              <span className="h-0.5 rounded bg-foreground" />
            </span>
          </summary>
          <nav aria-label="Mobile" className={cn(menuPanel, 'absolute right-0 mt-2 grid max-h-[calc(100svh-9rem)] w-72 overflow-y-auto')}>
            {TOOLS.map((group) => (
              <div key={group.label} className="grid">
                <p className={menuHeading}>{group.label}</p>
                {group.links.map((l) => (
                  <Link key={l.url} to={l.url} hash={'hash' in l ? l.hash : undefined} onClick={closeMenu} className={mobileLink}>
                    {l.title}
                  </Link>
                ))}
              </div>
            ))}
            <hr className="mx-2 my-2 border-border" />
            {NAV.map((n) => (
              <Link key={n.url} to={n.url} onClick={closeMenu} className={mobileLink}>
                {n.title}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const link = 'text-muted-foreground hover:text-foreground'
  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between sm:px-6">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Turn any clip into a WhatsApp sticker. Free, no app, nothing to sign up for.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-8 text-[15px] sm:grid-cols-3">
          {TOOLS.map((group) => (
            <div key={group.label} className="grid content-start gap-3">
              <p className="font-mono text-[11px] font-medium tracking-wider text-dim uppercase">{group.label}</p>
              {group.links.map((l) => (
                <Link key={l.url} to={l.url} hash={'hash' in l ? l.hash : undefined} className={link}>
                  {l.title}
                </Link>
              ))}
            </div>
          ))}
          <div className="grid content-start gap-3">
            <p className="font-mono text-[11px] font-medium tracking-wider text-dim uppercase">gifdrop</p>
            <Link to="/" className={link}>
              Make a sticker
            </Link>
            {NAV.map((n) => (
              <Link key={n.url} to={n.url} className={link}>
                {n.title}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  )
}
