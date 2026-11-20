import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PixelarticonsArrowRight } from '#/components/icons/pixelarticons/arrow-right'
import { PixelarticonsClipboard } from '#/components/icons/pixelarticons/clipboard'
import { PixelarticonsDownload } from '#/components/icons/pixelarticons/download'
import { PixelarticonsLink } from '#/components/icons/pixelarticons/link'
import { PixelarticonsLoader } from '#/components/icons/pixelarticons/loader'
import { PixelarticonsReload } from '#/components/icons/pixelarticons/reload'
import { PixelarticonsSparkles } from '#/components/icons/pixelarticons/sparkles'
import { Button } from '#/components/ui/button'
import { fetchLink, reach } from '#/lib/client'
import { cn } from '#/lib/utils'
import type { Platform, Post, PostVideo, Variant } from '#/lib/downloader'

const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v)

const schema = z.object({
  link: z.string().trim().min(1, 'Paste a link first').max(2048).refine(isLink, 'That doesn’t look like a link'),
})
type Form = z.infer<typeof schema>

const INK_SHADOW = 'shadow-[2px_2px_0_var(--foreground)]'
const INK_SHADOW_LG = 'shadow-[4px_4px_0_var(--foreground)]'

type Copy = {
  name: string
  headline: string
  blurb: string
  chips: [string, string, string]
  label: string
  placeholder: string
  hint: string
  how: [string, string][]
  faq: [string, string][]
}

const SAVE_ON_PHONE: [string, string] = [
  'Where does the video go on my phone?',
  'On iPhone it lands in Files → Downloads; open it and tap Share → Save Video to add it to Photos. On Android it’s in your Downloads folder.',
]
const PRIVATE: [string, string] = ['Can I download from private accounts?', 'No. Only posts anyone can see will work.']
const FAIR_USE: [string, string] = [
  'Is it OK to download someone’s video?',
  'Save videos for yourself and respect the person who made them. Ask before you repost someone else’s work.',
]

// one page, three platforms: same steps and wording everywhere, only the facts change
const COPY: Record<Platform, Copy> = {
  x: {
    name: 'X',
    headline: 'X (Twitter) video.',
    blurb: 'Paste a post link, pick a quality, and save the MP4 to your phone or computer.',
    chips: ['No sign-up', 'Up to 4K', 'Free, no watermark'],
    label: 'Paste an X video link',
    placeholder: 'https://x.com/…/status/…',
    hint: 'Works with x.com and twitter.com links to public posts.',
    how: [
      ['Copy the post link.', 'On X, tap Share → Copy link on any post with a video or GIF.'],
      ['Paste it here.', 'We find every quality X has for that video, from data-saver up to full HD and 4K.'],
      ['Pick a quality, download.', 'The MP4 saves straight to your phone or computer. No watermark.'],
    ],
    faq: [
      ['Is the X video downloader free?', 'Yes. No sign-up and no watermark.'],
      ['Which quality should I pick?', 'The top option is the best version X has. Each one shows its file size, so pick a smaller one if you’re on mobile data.'],
      ['Does it work with GIFs on X?', 'Yes. X stores GIFs as short MP4 videos, so that’s what you get.'],
      SAVE_ON_PHONE,
      PRIVATE,
      FAIR_USE,
    ],
  },
  tiktok: {
    name: 'TikTok',
    headline: 'TikTok video.',
    blurb: 'Paste a TikTok link and save the MP4 to your phone or computer, without the watermark.',
    chips: ['No sign-up', 'No watermark', 'Free'],
    label: 'Paste a TikTok video link',
    placeholder: 'https://www.tiktok.com/@…/video/…',
    hint: 'Works with tiktok.com links to public videos.',
    how: [
      ['Copy the video link.', 'On TikTok, tap Share → Copy link on the video you want.'],
      ['Paste it here.', 'We find the video and show you who posted it, so you know it’s the right one.'],
      ['Download.', 'The MP4 saves straight to your phone or computer, with no TikTok watermark on it.'],
    ],
    faq: [
      ['Is the TikTok video downloader free?', 'Yes, and there is no sign-up.'],
      ['Does the video have a watermark?', 'No. You get the clean video, without the TikTok logo that the app adds when you save.'],
      ['Does it work with photo slideshows?', 'No. Only video posts can be downloaded.'],
      SAVE_ON_PHONE,
      PRIVATE,
      FAIR_USE,
    ],
  },
  instagram: {
    name: 'Instagram',
    headline: 'Instagram video.',
    blurb: 'Paste a Reel or video post link and save the MP4 to your phone or computer.',
    chips: ['No sign-up', 'Reels and video posts', 'Free'],
    label: 'Paste an Instagram video link',
    placeholder: 'https://www.instagram.com/reel/…',
    hint: 'Works with instagram.com links to public Reels and video posts.',
    how: [
      ['Copy the Reel link.', 'On Instagram, tap Share → Copy link on the Reel or video post.'],
      ['Paste it here.', 'We find the video and show you who posted it, so you know it’s the right one.'],
      ['Download.', 'The MP4 saves straight to your phone or computer.'],
    ],
    faq: [
      ['Is the Instagram video downloader free?', 'Yes, and there is no sign-up.'],
      ['What if a post has several videos?', 'You get the first video in the post.'],
      ['Does it work with stories?', 'No. Only Reels and video posts can be downloaded.'],
      SAVE_ON_PHONE,
      PRIVATE,
      FAIR_USE,
    ],
  },
}

async function fetchVideos(link: string): Promise<Post> {
  const res = await reach(`/api/video?url=${encodeURIComponent(link)}`)
  const body = (await res.json().catch(() => ({}))) as Partial<Post> & { error?: string }
  if (!res.ok || !body.videos) throw new Error(body.error ?? 'Something went wrong.')
  return body as Post
}

const fileUrl = (post: Post, v: Variant) =>
  `/api/video-file?${new URLSearchParams({ file: v.url, name: [post.handle, post.id, v.label].filter(Boolean).join('-') })}`

const formatSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  if (mb >= 10) return `${Math.round(mb)} MB`
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const formatDuration = (seconds: number) => {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function VideoDownloader({ platform }: { platform: Platform }) {
  // the link is kept with the result so the next step (sticker) can reuse it
  const [found, setFound] = useState<{ post: Post; link: string } | null>(null)
  const copy = COPY[platform]

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-16">
      <header className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
          <span className="text-brand-deep">✦</span> saved it before it got deleted
        </span>
        <h1 className="mt-8 max-w-[18ch] font-pixel text-[clamp(2.4rem,8vw,4.5rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance">
          Download any <span className="text-mint-ink">{copy.headline}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed font-medium text-muted-foreground md:text-xl">
          {copy.blurb}
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
          {copy.chips.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="font-bold text-mint-ink">✓</span> {t}
            </li>
          ))}
        </ul>
      </header>

      <section
        id="download"
        aria-label="Video downloader"
        className="relative z-10 mx-auto mt-12 max-w-3xl scroll-mt-24 rounded-[32px] border border-border bg-card p-5 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.05)] sm:p-10"
      >
        {found ? <Result {...found} onReset={() => setFound(null)} /> : <PasteLink copy={copy} onPost={(post, link) => setFound({ post, link })} />}
      </section>

      <section className="mx-auto mt-24 max-w-5xl" aria-labelledby="how">
        <div className="text-center">
          <span className={`inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold ${INK_SHADOW}`}>How it works</span>
          <h2 id="how" className="mt-4 font-display text-[clamp(1.9rem,6vw,2.25rem)] leading-tight font-bold tracking-tight text-balance">
            From post to camera roll in three steps.
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.how.map(([title, body], i) => (
            <li key={title} className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-[0_8px_30px_rgb(0_0_0/0.04)]">
              <span className={`grid size-12 place-items-center rounded-xl bg-brand font-display text-xl font-bold ${INK_SHADOW}`}>{i + 1}</span>
              <h3 className="mt-6 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 flex max-w-5xl flex-col gap-12 border-t border-foreground/5 pt-20 md:flex-row" aria-labelledby="faq">
        <div className="md:w-1/3">
          <span className={`inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold ${INK_SHADOW}`}>Good to know</span>
          <h2 id="faq" className="mt-4 font-display text-4xl font-bold tracking-tight">
            Before you ask.
          </h2>
        </div>
        <div className="flex flex-col gap-2 md:w-2/3">
          {copy.faq.map(([q, a], i) => (
            <Faq key={q} q={q} open={i === 0}>
              {a}
            </Faq>
          ))}
          <Faq q="Can I turn the video into a WhatsApp sticker?">
            Yes.{' '}
            <Link to="/" hash="make" className="font-semibold text-mint-ink underline underline-offset-4">
              Use the sticker maker
            </Link>{' '}
            with the same link.
          </Faq>
        </div>
      </section>
    </main>
  )
}

function Faq({ q, open, children }: { q: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-foreground/10 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
        {q}
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background text-sm transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="pt-4 pr-8 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </details>
  )
}

function PasteLink({ copy, onPost }: { copy: Copy; onPost: (post: Post, link: string) => void }) {
  const { register, handleSubmit, setValue, setError, watch, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { link: '' },
  })
  const link = watch('link')
  const busy = formState.isSubmitting

  const onSubmit = handleSubmit(async ({ link: l }) => {
    const id = toast.loading('Finding the video…')
    try {
      const post = await fetchVideos(l)
      toast.success('Found it', { id })
      onPost(post, l)
    } catch (e) {
      // a toast is gone in seconds; the reason stays under the box until the link changes
      toast.dismiss(id)
      setError('link', { type: 'server', message: (e as Error).message })
    }
  })

  // on phones there's no global paste, so a button reads the clipboard: copy in the app, tap Paste here
  const pasteFromClipboard = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (!isLink(text)) return toast.error('No link on your clipboard')
      setValue('link', text, { shouldValidate: true })
      void onSubmit()
    } catch {
      toast('Long-press the box and tap Paste', { icon: '📋' })
    }
  }

  // desktop: paste a link anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text').trim()
      if (text && isLink(text) && !(e.target instanceof HTMLInputElement)) {
        setValue('link', text)
        void onSubmit()
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onSubmit, setValue])

  return (
    <>
      <span aria-hidden className={`mx-auto grid size-16 rotate-3 place-items-center rounded-2xl bg-brand ${INK_SHADOW_LG}`}>
        <PixelarticonsDownload className="size-8" />
      </span>

      <form onSubmit={onSubmit} noValidate className="mx-auto mt-6 max-w-xl">
        <label htmlFor="link" className="mb-3 block text-center font-display text-2xl font-bold tracking-tight md:text-3xl">
          {copy.label}
        </label>
        <div className="flex h-16 items-center gap-2 rounded-full border-2 border-border bg-card pr-2 pl-5 transition focus-within:border-foreground focus-within:ring-4 focus-within:ring-brand/20">
          <PixelarticonsLink className="size-5 shrink-0 text-dim" aria-hidden />
          {/* 16px+ so iOS Safari doesn't zoom the page on focus */}
          <input
            id="link"
            type="url"
            inputMode="url"
            enterKeyHint="go"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={copy.placeholder}
            aria-invalid={!!formState.errors.link || undefined}
            aria-describedby={formState.errors.link ? 'link-error' : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-dim"
            {...register('link')}
          />
          {link ? (
            <Button type="submit" disabled={busy} className="h-12 shrink-0 rounded-full bg-foreground px-6 text-background hover:bg-black" aria-label="Find video">
              {busy ? <PixelarticonsLoader className="animate-spin" /> : <PixelarticonsArrowRight />}
              <span className="hidden sm:inline">Find video</span>
            </Button>
          ) : (
            <Button type="button" onClick={pasteFromClipboard} className="h-12 shrink-0 rounded-full bg-foreground px-6 text-background hover:bg-black">
              <PixelarticonsClipboard /> Paste
            </Button>
          )}
        </div>
        {formState.errors.link && (
          <p id="link-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
            {formState.errors.link.message}
          </p>
        )}
      </form>

      <p className="mx-auto mt-8 w-fit rounded-full border border-border bg-background px-4 py-2 text-center text-xs font-medium text-muted-foreground">
        {copy.hint}
      </p>
    </>
  )
}

function Result({ post, link, onReset }: { post: Post; link: string; onReset: () => void }) {
  const navigate = useNavigate()
  // same move as "Use again" on My stickers: load the clip, then open the sticker maker
  const toSticker = () =>
    toast
      .promise(fetchLink(link), { loading: 'Grabbing your clip…', success: 'Got it', error: (e: Error) => e.message })
      .then(() => navigate({ to: '/', hash: 'make' }))
      .catch(() => {})

  return (
    <>
      <div className="min-w-0">
        {/* Instagram gives a handle but no display name; show whichever we have, never an empty line */}
        <p className="truncate text-lg font-bold">
          {post.author || (post.handle ? `@${post.handle}` : `${COPY[post.platform].name} video`)}
          {post.author && post.handle && <span className="font-medium text-dim"> @{post.handle}</span>}
        </p>
        {post.text && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.text}</p>}
      </div>

      {post.videos.map((video, i) => (
        <VideoCard key={video.variants[0].url} post={post} video={video} title={post.videos.length > 1 ? `Video ${i + 1} of ${post.videos.length}` : undefined} />
      ))}

      {/* never a dead end: the same clip can go straight into the sticker maker */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onReset}>
          <PixelarticonsReload /> Download another video
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={toSticker}>
          <PixelarticonsSparkles /> Make it a sticker
        </Button>
      </div>
    </>
  )
}

function VideoCard({ post, video, title }: { post: Post; video: PostVideo; title?: string }) {
  const best = video.variants[0]
  const isGif = video.kind === 'gif'

  return (
    <div className="mt-6 border-t border-border pt-6">
      {title && <h3 className="mb-4 text-sm font-bold text-muted-foreground">{title}</h3>}
      {/* no cover image (Instagram): the download fills the row instead of sitting next to an empty box */}
      <div className={cn('grid items-start gap-5', video.thumbnail && 'sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}>
        {video.thumbnail && (
          <div className="relative overflow-hidden rounded-2xl bg-foreground">
            {/* width/height reserve the right shape before the image loads */}
            <img src={video.thumbnail} alt="" width={best.width || undefined} height={best.height || undefined} className="mx-auto h-auto max-h-80 w-full object-contain" />
            {(isGif || video.duration > 0) && (
              <span className="absolute right-2 bottom-2 rounded-full bg-foreground/85 px-2.5 py-1 text-[11px] font-bold text-background">
                {isGif ? 'GIF' : formatDuration(video.duration)}
              </span>
            )}
          </div>
        )}

        <ul className="grid gap-2.5" aria-label="Choose a quality">
          {video.variants.map((v, i) => (
            <li key={v.url}>
              <a
                href={fileUrl(post, v)}
                download
                onClick={() => toast.success('Download started')}
                className={cn(
                  'flex h-16 items-center gap-3 rounded-2xl border-2 px-4 transition outline-none focus-visible:ring-4 focus-visible:ring-brand/40',
                  i === 0
                    ? `border-foreground bg-brand ${INK_SHADOW_LG} hover:bg-[#7fdcae] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`
                    : 'border-border bg-card hover:border-foreground',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-display text-lg leading-tight font-bold">
                    {isGif ? 'GIF' : v.label || 'Video'}
                    {i === 0 && video.variants.length > 1 && (
                      <span className="rounded-full bg-foreground px-2 py-0.5 font-sans text-[10px] font-bold tracking-wide text-background uppercase">Best</span>
                    )}
                  </span>
                  <span className={cn('block text-xs font-medium', i === 0 ? 'text-foreground/70' : 'text-muted-foreground')}>
                    {['MP4', v.width && v.height ? `${v.width}×${v.height}` : '', v.size ? formatSize(v.size) : ''].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold">
                  Download <PixelarticonsDownload className="size-5" aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
