import { Link, useRouterState } from '@tanstack/react-router'
import { PixelarticonsClock } from '#/components/icons/pixelarticons/clock'
import { PixelarticonsSparkles } from '#/components/icons/pixelarticons/sparkles'
import { PixelarticonsInfoBox } from '#/components/icons/pixelarticons/info-box'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar'

export const NAV = [
  { title: 'Convert', url: '/', icon: PixelarticonsSparkles },
  { title: 'History', url: '/history', icon: PixelarticonsClock },
  { title: 'How it works', url: '/help', icon: PixelarticonsInfoBox },
] as const

export function pageTitle(pathname: string) {
  return NAV.find((n) => n.url === pathname)?.title ?? 'gifdrop'
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {/* pixel droplet on a 12x12 grid, so it stays crisp at 24px; public/favicon.svg uses the same shape */}
      <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden className="size-6 shrink-0">
        <path className="fill-brand" d="M5 0h2v2h1v2h1v1h1v2h1v3h-1v1h-1v1h-6v-1h-1v-1h-1v-3h1v-2h1v-1h1v-2h1z" />
        <path className="fill-brand-ink/30" d="M3 5h1v2h-1z" />
        <path className="fill-brand-ink" d="M5 5h1v1h1v1h1v1h-1v1h-1v1h-1z" />
      </svg>
      {!compact && <span className="text-[15px] font-medium tracking-[-0.3px] text-foreground">gifdrop</span>}
    </span>
  )
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { isMobile, setOpenMobile, state } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-2">
        <Link to="/" aria-label="gifdrop home" className="flex w-fit">
          <Logo compact={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup className="px-3 group-data-[collapsible=icon]:px-2">
          <SidebarGroupLabel className="font-mono text-[11px] font-normal text-dim">tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV.map((item) => {
                const active = pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link
                        to={item.url}
                        onClick={() => isMobile && setOpenMobile(false)}
                        aria-current={active ? 'page' : undefined}
                        className="h-10 text-sm md:h-8 md:text-[13px] data-[active=true]:shadow-[inset_0_0_0_1px_#2a2a2e]"
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg bg-card p-3 shadow-[inset_0_0_0_1px_var(--border)]">
          <p className="font-mono text-[11px] text-dim">tip</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Open gifdrop on your phone. The share button sends straight to WhatsApp.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
