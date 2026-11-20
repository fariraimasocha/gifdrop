// X (Twitter) video downloader: turn a post into its downloadable MP4 files.
// Posts are resolved through the public fxtwitter API; files only ever come from X's video CDN.

export type Variant = { url: string; width: number; height: number; label: string; size: number | null }
export type TweetVideo = { kind: 'video' | 'gif'; thumbnail: string | null; duration: number; variants: Variant[] }
export type TweetVideos = { id: string; author: string; handle: string; text: string; videos: TweetVideo[] }

type FxFormat = { url?: string; container?: string }
type FxMedia = {
  type?: string
  thumbnail_url?: string
  duration?: number
  width?: number
  height?: number
  formats?: FxFormat[]
}
export type FxTweet = { text?: string; author?: { name?: string; screen_name?: string }; media?: { all?: FxMedia[] } }

// the only files /api/x-video-file will stream, so it can't be used as an open proxy
export function isTwitterVideoUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  return u.protocol === 'https:' && u.hostname === 'video.twimg.com' && u.pathname.endsWith('.mp4')
}

// every MP4 rendition of every video/GIF in the post, best quality first
export function parseTweetVideos(tweet: FxTweet): TweetVideo[] {
  return (tweet.media?.all ?? []).flatMap((m): TweetVideo[] => {
    if (m.type !== 'video' && m.type !== 'gif') return []
    const variants = (m.formats ?? [])
      .flatMap((f): Variant[] => {
        if (f.container !== 'mp4' || !f.url || !isTwitterVideoUrl(f.url)) return []
        // a rendition's size is in its path (…/vid/avc1/1280x720/…); GIFs have one file at the post's own size
        const dims = f.url.match(/\/(\d{2,5})x(\d{2,5})\//)
        const width = dims ? Number(dims[1]) : (m.width ?? 0)
        const height = dims ? Number(dims[2]) : (m.height ?? 0)
        // "720p" means the short side, so portrait clips are named the way people expect
        const short = Math.min(width, height)
        return [{ url: f.url, width, height, label: short ? `${short}p` : 'MP4', size: null }]
      })
      .sort((a, b) => b.width * b.height - a.width * a.height)
    if (!variants.length) return []
    const thumbnail = m.thumbnail_url?.startsWith('https://pbs.twimg.com/') ? m.thumbnail_url : null
    return [{ kind: m.type, thumbnail, duration: m.duration ?? 0, variants }]
  })
}

export async function resolveTweetVideos(id: string): Promise<TweetVideos | 'missing' | 'no-video'> {
  const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'user-agent': 'gifdrop/0.1' },
  })
  if (!res.ok) return 'missing'
  // fxtwitter answers some bad ids with an HTML page instead of JSON
  const data = await res.json<{ tweet?: FxTweet }>().catch(() => null)
  const tweet = data?.tweet
  if (!tweet) return 'missing'

  const videos = parseTweetVideos(tweet)
  if (!videos.length) return 'no-video'

  // real file sizes so people on mobile data can choose; a failed lookup just hides the size
  await Promise.all(
    videos.flatMap((v) =>
      v.variants.map(async (variant) => {
        const head = await fetch(variant.url, { method: 'HEAD' }).catch(() => null)
        variant.size = (head?.ok && Number(head.headers.get('content-length'))) || null
      }),
    ),
  )

  return {
    id,
    author: tweet.author?.name ?? '',
    handle: tweet.author?.screen_name ?? '',
    text: tweet.text ?? '',
    videos,
  }
}

// filename for the download; only safe characters ever reach the content-disposition header
export function downloadName(raw: string | undefined): string {
  return `${raw?.replace(/[^\w-]/g, '').slice(0, 80) || 'x-video'}.mp4`
}
