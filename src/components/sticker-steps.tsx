import { useMemo, useRef, useState } from 'react'
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

  return (
    <>
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.03em]">Pick the part worth sending.</h2>
      <button
        type="button"
        onClick={() => setCurrent(null)}
        className="mt-3 inline-flex items-center gap-1.5 py-1 text-[17px] font-semibold underline decoration-brand decoration-[3px] underline-offset-[6px]"
      >
        <PixelarticonsReload className="size-4" /> Change clip
      </button>

      <div className="mt-4 grid aspect-square max-h-[55svh] w-full place-items-center overflow-hidden rounded-[22px] border border-border bg-checker">
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

      {isVideo && duration > 0 ? (
        <>
          <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
            A few seconds. All the drama. Drag to pick up to {MAX_SECS} seconds, set the framing, we’ll build the loop.
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[17px] font-semibold">Clip</span>
            <span className="rounded-full bg-muted px-3 py-1 text-[15px] font-semibold tabular-nums">
              {s1(start)} – {s1(start + secs)} · {s1(secs)}
            </span>
          </div>
          {/* ponytail: one range for the start, length chips below. Add a filmstrip + edge handles if people ask */}
          <div className="relative mt-3 h-16 rounded-2xl bg-foreground">
            <div
              aria-hidden
              className="absolute inset-y-0 rounded-2xl border-[3px] border-foreground bg-brand/90 shadow-[inset_0_0_0_3px_var(--brand)] transition-[left,width] duration-75"
              style={{ left: `${(start / duration) * 100}%`, width: `${(secs / duration) * 100}%` }}
            />
            <input
              type="range"
              aria-label="Clip start"
              min={0}
              max={Math.max(0, duration - secs)}
              step={0.1}
              value={start}
              disabled={duration <= secs}
              onChange={(e) => {
                const v = Number(e.target.value)
                setO({ ...o, start: v })
                if (video.current) video.current.currentTime = v
              }}
              className="absolute inset-0 size-full cursor-grab opacity-0 active:cursor-grabbing"
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Length">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={o.secs === n}
                disabled={n > Math.ceil(duration)}
                onClick={() => setO({ ...o, secs: n })}
                className={cn(
                  'h-11 rounded-xl border-2 text-[15px] font-semibold disabled:opacity-40',
                  o.secs === n ? 'border-foreground bg-brand-soft' : 'border-border',
                )}
              >
                {n}s
              </button>
            ))}
          </div>
        </>
      ) : (
        !isVideo && <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">GIFs keep their first {MAX_SECS} seconds. Set the framing and we’ll build the loop.</p>
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

      <Button variant="brand" onClick={make} disabled={!!stage} className="mt-6 h-16 w-full text-lg">
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
    </>
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
        <img src={gif.previewUrl} alt="Your sticker. Press and hold, then Copy image." className="max-h-full max-w-full [-webkit-touch-callout:default]" />
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
