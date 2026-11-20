// Resolve a pasted link to a direct media URL we're willing to proxy.
// Only allowlisted hosts are ever fetched, so /api/media can't be used as an open proxy.

export const MAX_BYTES = 25 * 1024 * 1024 // ponytail: WhatsApp caps GIF-ish clips well below this

const MEDIA_HOSTS = [
  /^video\.twimg\.com$/,
  /^pbs\.twimg\.com$/,
  /^(i|media\d?)\.giphy\.com$/,
  /^media\d?\.tenor\.com$/,
  /^i\.imgur\.com$/,
  /(^|\.)tiktokcdn(-us|-eu)?\.com$/,
  /(^|\.)tiktokv\.com$/,
  /^(www\.)?tikwm\.com$/,
  /(^|\.)cdninstagram\.com$/,
  /(^|\.)fbcdn\.net$/,
]

export const ALLOWED_TYPES = ['image/gif', 'video/mp4']

export function isAllowedMediaUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  return u.protocol === 'https:' && MEDIA_HOSTS.some((re) => re.test(u.hostname))
}

export type Resolved =
  | { kind: 'tweet'; id: string }
  | { kind: 'tiktok'; url: string }
  | { kind: 'instagram'; id: string }
  | { kind: 'direct'; url: string }
  | { kind: 'invalid' }

export function classify(raw: string): Resolved {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return { kind: 'invalid' }
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { kind: 'invalid' }
  const host = u.hostname.replace(/^(www\.|mobile\.)/, '')

  if (['x.com', 'twitter.com', 'fxtwitter.com', 'vxtwitter.com', 'fixupx.com'].includes(host)) {
    const m = u.pathname.match(/\/status(?:es)?\/(\d{1,25})/)
    return m ? { kind: 'tweet', id: m[1] } : { kind: 'invalid' }
  }

  if (/(^|\.)tiktok\.com$/.test(host)) return { kind: 'tiktok', url: `https://${u.hostname}${u.pathname}` }

  if (host === 'instagram.com') {
    const m = u.pathname.match(/\/(?:p|reels?|tv)\/([A-Za-z0-9_-]{5,40})/)
    return m ? { kind: 'instagram', id: m[1] } : { kind: 'invalid' }
  }

  // giphy.com/gifs/some-slug-ID → i.giphy.com/media/ID/giphy.gif
  if (host === 'giphy.com') {
    const m = u.pathname.match(/\/gifs\/(?:.*-)?([A-Za-z0-9]{6,40})\/?$/)
    return m ? { kind: 'direct', url: `https://i.giphy.com/media/${m[1]}/giphy.gif` } : { kind: 'invalid' }
  }

  u.protocol = 'https:'
  return isAllowedMediaUrl(u.href) ? { kind: 'direct', url: u.href } : { kind: 'invalid' }
}

type FxMedia = { type?: string; url?: string }

export async function resolveTweet(id: string): Promise<string | null> {
  const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'user-agent': 'gifdrop/0.1' },
  })
  if (!res.ok) return null
  const data = await res.json<{ tweet?: { media?: { all?: FxMedia[] } } }>()
  const all = data.tweet?.media?.all ?? []
  const pick = all.find((m) => m.type === 'gif') ?? all.find((m) => m.type === 'video')
  return pick?.url && isAllowedMediaUrl(pick.url) ? pick.url : null
}

// the embed mirrors only answer link-preview bots; TikTok's own pages only answer browsers
const BOT_UA = 'TelegramBot (like TwitterBot)'
export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// the numeric post id, from any TikTok address that carries one (/@user/video/1…, /v/1….html)
export const tiktokId = (raw: string) => new URL(raw).pathname.match(/\/(?:video|v)\/(\d{6,25})/)?.[1] ?? null

// ponytail: free third-party resolvers (no official API). If one dies, swap the URL here.
// Order matters: tikwm rations by IP and Workers share theirs with everyone, so on Cloudflare it is
// always over its daily limit. It only ever helps in local dev, as the fallback.
export async function tiktokFile(id: string): Promise<string | null> {
  // embed mirror: redirects a preview bot straight to the no-watermark file on TikTok's CDN
  const hop = await fetch(`https://www.kktiktok.com/@i/video/${id}`, {
    headers: { 'user-agent': BOT_UA },
    redirect: 'manual',
  }).catch(() => null)
  const loc = hop?.headers.get('location')
  if (loc && isAllowedMediaUrl(loc)) return loc

  const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(`https://www.tiktok.com/@i/video/${id}`)}`, {
    headers: { 'user-agent': 'gifdrop/0.1' },
  }).catch(() => null)
  if (!res?.ok) return null
  const data = await res.json<{ data?: { play?: string } }>().catch(() => null)
  const play = data?.data?.play
  if (!play) return null
  const abs = play.startsWith('/') ? `https://www.tikwm.com${play}` : play
  return isAllowedMediaUrl(abs) ? abs : null
}

export async function resolveTikTok(url: string): Promise<string | null> {
  let id = tiktokId(url)
  if (!id) {
    // share links (vm.tiktok.com/…, /t/…) carry a code, not the post: TikTok redirects them to the real address
    const res = await fetch(url, { headers: { 'user-agent': BROWSER_UA } }).catch(() => null)
    if (!res) return null
    void res.body?.cancel()
    id = tiktokId(res.url)
  }
  return id ? tiktokFile(id) : null
}

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')

export type InstagramPost = { url: string; handle: string; caption: string }

// what the InstaFix-style mirror's preview page says about a post
export function parseInstagramPage(html: string): { video: string | null; handle: string; caption: string } {
  const meta = (key: string) => html.match(new RegExp(`(?:property|name)="${key}"\\s+content="([^"]*)"`))?.[1]
  const video = meta('og:video(?::secure_url)?')
  // a real post is titled "@handle"; anything else is the mirror's "not found" page
  const handle = meta('twitter:title')?.match(/^@([\w.]+)$/)?.[1] ?? ''
  return { video: video ? decodeEntities(video) : null, handle, caption: decodeEntities(meta('og:description') ?? '') }
}

// InstaFix-style mirror: serves og:video pointing at Instagram's CDN
export async function fetchInstagram(id: string): Promise<InstagramPost | 'missing' | 'no-video'> {
  const res = await fetch(`https://www.eeinstagram.com/reel/${id}/`, {
    headers: { 'user-agent': BOT_UA },
  }).catch(() => null)
  if (!res?.ok) return 'missing'
  const page = parseInstagramPage(await res.text())
  if (!page.video) return page.handle ? 'no-video' : 'missing'
  // the mirror may hand back its own /videos/ redirect; follow it to the real CDN file
  const abs = new URL(page.video, 'https://www.eeinstagram.com').href
  if (isAllowedMediaUrl(abs)) return { url: abs, handle: page.handle, caption: page.caption }
  const hop = await fetch(abs, { redirect: 'manual' }).catch(() => null)
  const loc = hop?.headers.get('location')
  return loc && isAllowedMediaUrl(loc) ? { url: loc, handle: page.handle, caption: page.caption } : 'missing'
}

export async function resolveInstagram(id: string): Promise<string | null> {
  const post = await fetchInstagram(id)
  return typeof post === 'string' ? null : post.url
}
