// Video downloaders (X, TikTok, Instagram): turn a post link into its downloadable MP4 files.
// Files only ever come from the platforms' own CDNs (the allowlist in ./media.ts).
import { BROWSER_UA, fetchInstagram, isAllowedMediaUrl, tiktokFile, tiktokId } from './media.ts'
import type { Resolved } from './media.ts'

export type Platform = 'x' | 'tiktok' | 'instagram'
// label is the quality ("720p") when we know it, empty when the platform only offers one unnamed file
export type Variant = { url: string; width: number; height: number; label: string; size: number | null }
export type PostVideo = { kind: 'video' | 'gif'; thumbnail: string | null; duration: number; variants: Variant[] }
export type Post = { platform: Platform; id: string; author: string; handle: string; text: string; videos: PostVideo[] }
export type Lookup = Post | 'missing' | 'no-video'

// "720p" means the short side, so portrait clips are named the way people expect
const qualityLabel = (width: number, height: number) => (Math.min(width, height) ? `${Math.min(width, height)}p` : '')
const thumb = (url: string | undefined) => (url && isAllowedMediaUrl(url) ? url : null)

// ---------- X ----------

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

// every MP4 rendition of every video/GIF in the post, best quality first
export function parseTweetVideos(tweet: FxTweet): PostVideo[] {
  return (tweet.media?.all ?? []).flatMap((m): PostVideo[] => {
    if (m.type !== 'video' && m.type !== 'gif') return []
    const variants = (m.formats ?? [])
      .flatMap((f): Variant[] => {
        if (f.container !== 'mp4' || !f.url || !isAllowedMediaUrl(f.url)) return []
        // a rendition's size is in its path (…/vid/avc1/1280x720/…); GIFs have one file at the post's own size
        const dims = f.url.match(/\/(\d{2,5})x(\d{2,5})\//)
        const width = dims ? Number(dims[1]) : (m.width ?? 0)
        const height = dims ? Number(dims[2]) : (m.height ?? 0)
        return [{ url: f.url, width, height, label: qualityLabel(width, height), size: null }]
      })
      .sort((a, b) => b.width * b.height - a.width * a.height)
    if (!variants.length) return []
    return [{ kind: m.type, thumbnail: thumb(m.thumbnail_url), duration: m.duration ?? 0, variants }]
  })
}

async function resolveTweetPost(id: string): Promise<Lookup> {
  const res = await fetch(`https://api.fxtwitter.com/status/${id}`, {
    headers: { 'user-agent': 'gifdrop/0.1' },
  }).catch(() => null)
  if (!res?.ok) return 'missing'
  // fxtwitter answers some bad ids with an HTML page instead of JSON
  const data = await res.json<{ tweet?: FxTweet }>().catch(() => null)
  const tweet = data?.tweet
  if (!tweet) return 'missing'
  const videos = parseTweetVideos(tweet)
  if (!videos.length) return 'no-video'
  return { platform: 'x', id, author: tweet.author?.name ?? '', handle: tweet.author?.screen_name ?? '', text: tweet.text ?? '', videos }
}

// ---------- TikTok ----------

export type TikTokItem = {
  id?: string
  desc?: string
  author?: { uniqueId?: string; nickname?: string }
  imagePost?: unknown
  video?: { duration?: number; width?: number; height?: number; cover?: string }
}

// TikTok's own post page embeds the post as JSON. null = the page didn't say either way (blocked, redesigned).
export function parseTikTokPage(html: string): TikTokItem | 'missing' | null {
  const json = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)?.[1]
  if (!json) return null
  let detail: { statusCode?: number; itemInfo?: { itemStruct?: TikTokItem } } | undefined
  try {
    detail = JSON.parse(json).__DEFAULT_SCOPE__?.['webapp.video-detail']
  } catch {
    return null
  }
  if (detail?.itemInfo?.itemStruct) return detail.itemInfo.itemStruct
  // a non-zero status is TikTok saying the post is gone or private; no status at all is some other page
  return detail?.statusCode ? 'missing' : null
}

async function resolveTikTokPost(url: string): Promise<Lookup> {
  // TikTok's own page gives the details and follows share links (vm.tiktok.com/…, /t/…) to the real post
  const res = await fetch(url, {
    headers: { 'user-agent': BROWSER_UA, 'accept-language': 'en-US,en;q=0.9' },
  }).catch(() => null)
  const page = res?.ok ? parseTikTokPage(await res.text()) : null
  if (page === 'missing') return 'missing'
  if (page?.imagePost) return 'no-video'
  const id = page?.id ?? (res && tiktokId(res.url)) ?? tiktokId(url)
  if (!id) return 'missing'

  // the file comes from the mirror: the page's own video links only work with its cookies
  const file = await tiktokFile(id)
  if (!file) return 'missing'
  const width = page?.video?.width ?? 0
  const height = page?.video?.height ?? 0
  return {
    platform: 'tiktok',
    id,
    author: page?.author?.nickname ?? '',
    handle: page?.author?.uniqueId ?? '',
    text: page?.desc ?? '',
    videos: [
      {
        kind: 'video',
        thumbnail: thumb(page?.video?.cover),
        duration: page?.video?.duration ?? 0,
        variants: [{ url: file, width, height, label: qualityLabel(width, height), size: null }],
      },
    ],
  }
}

// ---------- Instagram ----------

async function resolveInstagramPost(id: string): Promise<Lookup> {
  const post = await fetchInstagram(id)
  if (typeof post === 'string') return post
  return {
    platform: 'instagram',
    id,
    author: '',
    handle: post.handle,
    text: post.caption,
    // the mirror offers one file and no cover image or dimensions
    videos: [{ kind: 'video', thumbnail: null, duration: 0, variants: [{ url: post.url, width: 0, height: 0, label: '', size: null }] }],
  }
}

// ---------- shared ----------

// total size from a ranged answer's header: "bytes 0-0/265069" → 265069
export const rangeTotal = (contentRange: string | null) => Number(contentRange?.match(/\/(\d+)$/)?.[1]) || null

async function fileSize(url: string): Promise<number | null> {
  const head = await fetch(url, { method: 'HEAD' }).catch(() => null)
  const length = head?.ok ? Number(head.headers.get('content-length')) : 0
  if (length) return length
  // some TikTok CDN nodes answer HEAD with 503 but serve the file; ask for its first byte and read the total
  const res = await fetch(url, { headers: { range: 'bytes=0-0' } }).catch(() => null)
  void res?.body?.cancel()
  return res?.status === 206 ? rangeTotal(res.headers.get('content-range')) : null
}

// null = not a link any downloader handles
export async function lookupPost(target: Resolved): Promise<Lookup | null> {
  const post =
    target.kind === 'tweet'
      ? await resolveTweetPost(target.id)
      : target.kind === 'tiktok'
        ? await resolveTikTokPost(target.url)
        : target.kind === 'instagram'
          ? await resolveInstagramPost(target.id)
          : null
  if (!post || typeof post === 'string') return post

  // real file sizes so people on mobile data can choose; a failed lookup just hides the size
  await Promise.all(
    post.videos.flatMap((v) =>
      v.variants.map(async (variant) => {
        variant.size = await fileSize(variant.url)
      }),
    ),
  )
  return post
}

// filename for the download; only safe characters ever reach the content-disposition header
// (dots stay because TikTok and Instagram handles use them, but never leading or doubled)
export function downloadName(raw: string | undefined): string {
  const stem = raw
    ?.replace(/[^\w.-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .slice(0, 80)
  return `${stem || 'video'}.mp4`
}
