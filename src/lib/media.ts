// Resolve a pasted link to a direct media URL we're willing to proxy.
// Only allowlisted hosts are ever fetched, so /api/media can't be used as an open proxy.

export const MAX_BYTES = 25 * 1024 * 1024 // ponytail: WhatsApp caps GIF-ish clips well below this

const MEDIA_HOSTS = [
  /^video\.twimg\.com$/,
  /^pbs\.twimg\.com$/,
  /^(i|media\d?)\.giphy\.com$/,
  /^media\d?\.tenor\.com$/,
  /^i\.imgur\.com$/,
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
