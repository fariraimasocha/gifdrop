import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { PixelarticonsDownload } from '#/components/icons/pixelarticons/download'
import { PixelarticonsLoader } from '#/components/icons/pixelarticons/loader'
import { PixelarticonsReload } from '#/components/icons/pixelarticons/reload'
import { PixelarticonsSend } from '#/components/icons/pixelarticons/send'
import { PixelarticonsSparkles } from '#/components/icons/pixelarticons/sparkles'
import { Button } from '#/components/ui/button'
import { useGif } from '#/stores/gif'
import type { Current } from '#/stores/gif'
import { download } from '#/lib/client'
import { DEFAULTS, MAX_SECS, toSticker } from '#/lib/convert'
import type { StickerOptions } from '#/lib/convert'
import { cn } from '#/lib/utils'

const kb = (n: number) => `${Math.round(n / 1024)} KB`
const s1 = (n: number) => `${n.toFixed(1)}s`

// what the last make used, so "Make it again in Compact" can show the numbers that went in
let lastMade: (StickerOptions & { made: number }) | null = null

export function StickerEditor({ current }: { current: Current }) {
  const setCurrent = useGif((s) => s.setCurrent)
  const setGif = useGif((s) => s.setGif)
  const video = useRef<HTMLVideoElement>(null)
  const isVideo = current.file.type.startsWith('video/')
  const [duration, setDuration] = useState(0)
  const [now, setNow] = useState(0)
  // paved path: everything already picked, so the only required tap is "Make a sticker"
  const [o, setO] = useState<StickerOptions>(() => lastMade ?? DEFAULTS)
  const [stage, setStage] = useState<string | null>(null)
  const secs = Math.min(o.secs, duration || o.secs)
  const start = Math.min(o.start, Math.max(0, duration - secs))

  const make = async () => {
    const opts = { ...o, start, secs: isVideo ? secs : MAX_SECS }
    try {
      const out = await toSticker(current.file, opts, setStage)
      lastMade = { ...opts, side: out.side <= 320 ? 320 : 512, made: out.side }
      if (useGif.getState().current?.file === current.file) setGif(out.file)
    } catch (e) {
      toast.error((e as Error).message || 'Couldn’t make this one. Try another clip.')
    } finally {
      setStage(null)
    }
  }

  const trim = (next: { start: number; secs: number }, seekTo: number) => {
    setO({ ...o, ...next })
    if (video.current) video.current.currentTime = seekTo
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.03em] sm:text-[34px]">Pick the part worth sending.</h2>
        <button
          type="button"
          onClick={() => setCurrent(null)}
          className="inline-flex items-center gap-1.5 py-1 text-[16px] font-semibold underline decoration-brand decoration-[3px] underline-offset-[6px]"
        >
          <PixelarticonsReload className="size-4" /> Change clip
        </button>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-10">
        <div>
          <div className="grid aspect-square max-h-[55svh] w-full place-items-center overflow-hidden rounded-[22px] border border-border bg-checker md:max-h-none">
            {isVideo ? (
              <video
                ref={video}
                src={current.previewUrl}
                autoPlay
                loop
                muted
                playsInline
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                // preview loops only the picked window
                onTimeUpdate={(e) => {
                  const v = e.currentTarget
                  if (v.currentTime < start || v.currentTime > start + secs) v.currentTime = start
                  setNow(v.currentTime)
                }}
                className={cn('max-h-full max-w-full', o.crop && 'size-full object-cover')}
              />
            ) : (
              <img src={current.previewUrl} alt="Your clip" className={cn('max-h-full max-w-full', o.crop && 'size-full object-cover')} />
            )}
          </div>
          <p className="mt-3 flex justify-between gap-4 text-[15px]">
            <span className="font-semibold">Original {isVideo ? 'video' : 'GIF'}</span>
            <span className="truncate text-muted-foreground">{current.file.name}</span>
          </p>
        </div>

        <div>
          {isVideo && duration > 0 ? (
            <>
              <p className="text-[17px] leading-relaxed text-muted-foreground">
                A few seconds. All the drama. Drag the window or its edges to pick up to {MAX_SECS} seconds.
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-[17px] font-semibold">Clip</span>
                <span className="rounded-full bg-muted px-3 py-1 font-mono text-[13px] font-medium tabular-nums">
                  {s1(start)} – {s1(start + secs)} · {s1(secs)}
                </span>
              </div>
              <TrimStrip src={current.previewUrl} duration={duration} start={start} secs={secs} now={now} onChange={trim} />
            </>
          ) : (
            !isVideo && <p className="text-[17px] leading-relaxed text-muted-foreground">GIFs keep their first {MAX_SECS} seconds. Set the framing and we’ll build the loop.</p>
          )}

          <label htmlFor="res" className="mt-6 block text-[17px] font-semibold">
            Resolution
          </label>
          <div className="relative mt-2">
            <select
              id="res"
              value={o.side}
              onChange={(e) => setO({ ...o, side: Number(e.target.value) as 512 | 320 })}
              className="h-14 w-full appearance-none rounded-2xl border-2 border-border bg-card px-5 text-[17px] outline-none focus:border-foreground"
            >
              <option value={512}>High · 512 × 512</option>
              <option value={320}>Compact · 320 × 320</option>
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-5 size-2.5 -translate-y-3/4 rotate-45 border-r-2 border-b-2 border-foreground" />
          </div>

          <p className="mt-6 text-[17px] font-semibold">Framing</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-muted p-1.5" role="radiogroup" aria-label="Framing">
            {[
              [false, 'Fit entire clip'],
              [true, 'Square crop'],
            ].map(([crop, label]) => (
              <button
                key={String(crop)}
                type="button"
                role="radio"
                aria-checked={o.crop === crop}
                onClick={() => setO({ ...o, crop: crop as boolean })}
                className={cn(
                  'h-12 rounded-full text-[16px] font-semibold transition',
                  o.crop === crop ? 'bg-card shadow-[0_1px_3px_rgb(16_16_16/0.15)]' : 'text-muted-foreground',
                )}
              >
                {label as string}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[15px] text-muted-foreground">
            {o.crop ? 'Fills the square. Edges get trimmed.' : 'Keeps the whole clip, with transparent padding.'}
          </p>

          <Button variant="brand" onClick={make} disabled={!!stage} className="mt-6 h-16 w-full text-lg shadow-[3px_3px_0_var(--foreground)]">
            {stage ? (
              <>
                <PixelarticonsLoader className="size-5 animate-spin" /> {stage}
              </>
            ) : (
              <>
                Make a sticker <PixelarticonsSparkles className="size-5" />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-[15px] text-muted-foreground">Converts on your device. Nothing is uploaded.</p>
        </div>
      </div>
    </>
  )
}

const THUMBS = 8
const MIN_SECS = 0.5

// filmstrip of the clip with a draggable window: drag the middle to move it, the edges to resize it
function TrimStrip({
  src,
  duration,
  start,
  secs,
  now,
  onChange,
}: {
  src: string
  duration: number
  start: number
  secs: number
  now: number
  onChange: (v: { start: number; secs: number }, seekTo: number) => void
}) {
  const strip = useRef<HTMLDivElement>(null)
  const [thumbs, setThumbs] = useState<string[]>([])
  const drag = useRef<{ mode: 'move' | 'start' | 'end'; x: number; start: number; secs: number } | null>(null)

  // grab frames off a hidden video so the preview keeps playing undisturbed
  useEffect(() => {
    let dead = false
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.src = src
    const c = document.createElement('canvas')
    const grab = async () => {
      const out: string[] = []
      for (let i = 0; i < THUMBS && !dead; i++) {
        v.currentTime = ((i + 0.5) / THUMBS) * duration
        await new Promise((r) => v.addEventListener('seeked', r, { once: true }))
        c.height = 96
        c.width = Math.round((96 * v.videoWidth) / (v.videoHeight || 1)) || 96
        c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height)
        out.push(c.toDataURL('image/jpeg', 0.6))
        if (!dead) setThumbs([...out])
      }
    }
    v.addEventListener('loadeddata', () => void grab().catch(() => {}), { once: true })
    return () => {
      dead = true
      v.removeAttribute('src')
      v.load()
    }
  }, [src, duration])

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
  const maxLen = Math.min(MAX_SECS, duration)

  const set = (mode: 'move' | 'start' | 'end', s: number, len: number) => {
    if (mode === 'move') {
      const ns = clamp(s, 0, duration - len)
      onChange({ start: ns, secs: len }, ns)
    } else if (mode === 'start') {
      const end = s + len
      const ns = clamp(s, Math.max(0, end - maxLen), end - MIN_SECS)
      onChange({ start: ns, secs: end - ns }, ns)
    } else {
      const ne = clamp(s + len, s + MIN_SECS, Math.min(duration, s + maxLen))
      onChange({ start: s, secs: ne - s }, Math.max(s, ne - 0.3))
    }
  }

  const down = (mode: 'move' | 'start' | 'end') => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mode, x: e.clientX, start, secs }
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    const w = strip.current?.clientWidth
    if (!d || !w) return
    const dt = ((e.clientX - d.x) / w) * duration
    if (d.mode === 'move') set('move', d.start + dt, d.secs)
    else if (d.mode === 'start') set('start', d.start + dt, d.secs - dt)
    else set('end', d.start, d.secs + dt)
  }
  const up = () => (drag.current = null)
  // keyboard: arrows nudge by 0.1s (shift: 0.5s)
  const key = (mode: 'move' | 'start' | 'end') => (e: React.KeyboardEvent) => {
    const step = (e.shiftKey ? 0.5 : 0.1) * (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0)
    if (!step) return
    e.preventDefault()
    if (mode === 'move') set('move', start + step, secs)
    else if (mode === 'start') set('start', start + step, secs - step)
    else set('end', start, secs + step)
  }

  const pct = (t: number) => `${(t / duration) * 100}%`
  const handle =
    'absolute inset-y-0 z-10 grid w-5 cursor-ew-resize touch-none place-items-center bg-brand outline-none focus-visible:ring-2 focus-visible:ring-foreground'

  return (
    <div
      ref={strip}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerDown={(e) => {
        // tap outside the window: jump it there
        const r = strip.current!.getBoundingClientRect()
        set('move', ((e.clientX - r.left) / r.width) * duration - secs / 2, secs)
      }}
      className="relative mt-3 h-[72px] touch-none overflow-hidden rounded-2xl bg-foreground select-none"
    >
      <div aria-hidden className="absolute inset-0 flex">
        {Array.from({ length: THUMBS }, (_, i) =>
          thumbs[i] ? <img key={i} src={thumbs[i]} alt="" draggable={false} className="h-full min-w-0 flex-1 object-cover" /> : <span key={i} className="h-full flex-1 animate-pulse bg-white/10" />,
        )}
      </div>
      {/* dim everything outside the picked window */}
      <div aria-hidden className="absolute inset-y-0 left-0 bg-foreground/65" style={{ width: pct(start) }} />
      <div aria-hidden className="absolute inset-y-0 right-0 bg-foreground/65" style={{ left: pct(start + secs) }} />

      <div
        role="slider"
        tabIndex={0}
        aria-label="Clip position"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, duration - secs)}
        aria-valuenow={Number(start.toFixed(1))}
        aria-valuetext={`${s1(start)} to ${s1(start + secs)}`}
        onPointerDown={down('move')}
        onKeyDown={key('move')}
        className="absolute inset-y-0 cursor-grab touch-none rounded-2xl border-y-[3px] border-brand outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-brand"
        style={{ left: pct(start), width: pct(secs) }}
      >
        <span
          role="slider"
          tabIndex={0}
          aria-label="Clip start"
          aria-valuenow={Number(start.toFixed(1))}
          onPointerDown={down('start')}
          onKeyDown={key('start')}
          className={cn(handle, '-left-px rounded-l-2xl')}
        >
          <span className="h-6 w-1 rounded-full bg-foreground" />
        </span>
        <span
          role="slider"
          tabIndex={0}
          aria-label="Clip end"
          aria-valuenow={Number((start + secs).toFixed(1))}
          onPointerDown={down('end')}
          onKeyDown={key('end')}
          className={cn(handle, '-right-px rounded-r-2xl')}
        >
          <span className="h-6 w-1 rounded-full bg-foreground" />
        </span>
      </div>

      {/* playhead */}
      <span aria-hidden className="pointer-events-none absolute inset-y-1 z-20 w-0.5 rounded-full bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]" style={{ left: pct(now) }} />
    </div>
  )
}

// slot machine: a different line each time, so finishing never feels the same twice
const CHEERS = [
  'Ready. Go be dramatic.',
  'Fresh out the oven.',
  'Your group chat isn’t ready.',
  'Certified reaction.',
  'That’s the one.',
  'Send it before you overthink it.',
]

export function StickerReady({ current, made }: { current: Current; made: number }) {
  const setCurrent = useGif((s) => s.setCurrent)
  const setGif = useGif((s) => s.setGif)
  const gif = current.gif!
  const cheer = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], [gif.previewUrl])
  const info = lastMade

  return (
    <>
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.03em]">{cheer}</h2>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-[16px] font-semibold text-mint-ink" aria-live="polite">
        ✓ Sticker ready{made > 1 && <span className="font-normal">· #{made} you’ve made</span>}
      </p>

      <div className="mt-4 grid aspect-square w-full place-items-center rounded-[22px] border border-border bg-checker p-6">
        {/* a plain <img> on purpose: iOS/Android "Copy image" keeps the animation, the Clipboard API doesn't */}
        <img src={`${gif.previewUrl}#gifdrop.gif`} alt="Your sticker. Press and hold, then Copy image." className="size-full object-contain [-webkit-touch-callout:default]" />
      </div>

      <p className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-[#a8e9c6] bg-brand-soft px-5 py-4 text-[16px] font-semibold">
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-foreground">
          <span className="size-2 rounded-full bg-foreground" />
        </span>
        <span className="pointer-coarse:hidden">Right-click the animation → Copy image</span>
        <span className="hidden pointer-coarse:inline">Press &amp; hold the animation → Copy image</span>
      </p>
      <p className="mt-3 text-center text-[15px] text-muted-foreground tabular-nums">
        {info && `${info.secs.toFixed(1)} seconds · ${info.made} × ${info.made} · `}
        {kb(gif.file.size)}
      </p>

      <h3 className="mt-8 font-display text-2xl font-extrabold tracking-[-0.02em]">Get it into WhatsApp.</h3>
      <ol className="mt-4 grid gap-4">
        {[
          ['Copy the moving image', 'Hold the animation → Copy image.'],
          ['Paste into WhatsApp', 'Open a chat. Hold the message field → Paste.'],
          ['Check the preview, then send', 'Look for “Custom sticker”, then send. Tap it to save to Favorites.'],
        ].map(([t, b], i) => (
          <li key={t} className="flex gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold text-background">{i + 1}</span>
            <p className="leading-snug">
              <span className="block text-[17px] font-semibold">{t}</span>
              <span className="text-muted-foreground">{b}</span>
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl bg-muted p-4 text-[15px] leading-relaxed">
        <span className="font-semibold">No “Custom sticker” preview?</span>{' '}
        <span className="text-muted-foreground">WhatsApp skips big files. </span>
        <button type="button" onClick={() => setGif(null)} className="font-semibold underline decoration-brand decoration-[3px] underline-offset-4">
          Make it again in Compact or shorter
        </button>
      </div>

      {/* bottomless pit: the next thing to do is always the biggest thing on screen */}
      <div className="mt-6 grid gap-3">
        <Button asChild variant="brand" className="h-16 w-full text-lg">
          <a href="whatsapp://send">
            Open WhatsApp <PixelarticonsSend className="size-5" />
          </a>
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-13" onClick={() => download(gif.file)}>
            <PixelarticonsDownload /> Download GIF
          </Button>
          <Button variant="secondary" className="h-13" onClick={() => setCurrent(null)}>
            <PixelarticonsSparkles /> Make another
          </Button>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-dim">Nothing from this session leaves your phone.</p>
    </>
  )
}
