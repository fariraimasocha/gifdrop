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

// ponytail: free third-party resolvers (no official API). If one dies, swap the URL here.
export async function resolveTikTok(url: string): Promise<string | null> {
  const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
    headers: { 'user-agent': 'gifdrop/0.1' },
  })
  if (!res.ok) return null
  const data = await res.json<{ data?: { play?: string } }>()
  const play = data.data?.play
  if (!play) return null
  const abs = play.startsWith('/') ? `https://www.tikwm.com${play}` : play
  return isAllowedMediaUrl(abs) ? abs : null
}

// InstaFix-style mirror: serves og:video pointing at Instagram's CDN
export async function resolveInstagram(id: string): Promise<string | null> {
  const res = await fetch(`https://www.eeinstagram.com/reel/${id}/`, {
    headers: { 'user-agent': 'TelegramBot (like TwitterBot)' },
  })
  if (!res.ok) return null
  const m = (await res.text()).match(/property="og:video(?::secure_url)?"\s+content="([^"]+)"/)
  const video = m?.[1].replaceAll('&amp;', '&')
  if (!video) return null
  // the mirror may hand back its own /videos/ redirect; follow it to the real CDN file
  const abs = new URL(video, 'https://www.eeinstagram.com').href
  if (isAllowedMediaUrl(abs)) return abs
  const hop = await fetch(abs, { redirect: 'manual' })
  const loc = hop.headers.get('location')
  return loc && isAllowedMediaUrl(loc) ? loc : null
}
