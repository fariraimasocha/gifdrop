import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { PixelarticonsArrowRight } from '#/components/icons/pixelarticons/arrow-right'
import { PixelarticonsClipboard } from '#/components/icons/pixelarticons/clipboard'
import { PixelarticonsLink } from '#/components/icons/pixelarticons/link'
import { PixelarticonsLoader } from '#/components/icons/pixelarticons/loader'
import { Button } from '#/components/ui/button'
import { DropZone } from '#/components/drop-zone'
import { StickerEditor, StickerReady } from '#/components/sticker-steps'
import { useGif } from '#/stores/gif'
import { fetchLink, loadFile } from '#/lib/client'
import { cn } from '#/lib/utils'

const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v)

const schema = z.object({
  link: z.string().trim().min(1, 'Paste a link first').max(2048).refine(isLink, 'That doesn’t look like a link'),
})
type Form = z.infer<typeof schema>

const STEPS = ['Choose a clip', 'Make it yours', 'Copy & send'] as const

const HOW = [
  ['Bring your reaction.', 'Paste an X, TikTok, Instagram or GIPHY link, or pick a video or GIF from your phone.'],
  ['Keep the best bit.', 'Drag to the moment that matters, up to 4 seconds. We build the loop on your device.'],
  ['Copy, paste, send.', 'Hold the sticker → Copy image. Paste it in any WhatsApp chat and send it as a Custom sticker.'],
] as const

type Props = { eyebrow: string; headline: string; blurb: string; placeholder: string }

export function Converter({ eyebrow, headline, blurb, placeholder }: Props) {
  const current = useGif((s) => s.current)
  const made = useGif((s) => s.made)
  const step = !current ? 0 : current.gif ? 2 : 1
  const card = useRef<HTMLElement>(null)

  // phones: each new step starts at the top of the card, not wherever the last one was scrolled
  useEffect(() => {
    if (step > 0 && window.matchMedia('(max-width: 639px)').matches) {
      card.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [step])

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-16">
      {/* hero shrinks away once a clip is loaded: the work is the page now */}
      {step === 0 && (
        <header className="relative text-center">
          {/* floating reaction clips (public/hero, 240px 4s loops), desktop only so they never cover the headline on phones */}
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
            {HERO_CLIPS.map((c) => (
              <div key={c.src} className={cn('absolute animate-bob', c.at)}>
                <video src={c.src} autoPlay loop muted playsInline preload="metadata" className="size-28 rounded-2xl border-4 border-card object-cover shadow-xl xl:size-32" />
                <span className="absolute -right-3 -bottom-3 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold text-background">{c.tag}</span>
              </div>
            ))}
          </div>
          <div className="relative mx-auto flex max-w-4xl flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
              <span className="text-brand-deep">✦</span> {eyebrow}
            </span>
            <h1 className="mt-8 max-w-[21ch] font-pixel text-[clamp(2.4rem,8vw,4.5rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance">
              {headline} into a <span className="text-mint-ink">WhatsApp sticker.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed font-medium text-muted-foreground md:text-xl">{blurb}</p>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
              {['No sign-up', 'Converts on your device', 'Free, no watermark'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="font-bold text-mint-ink">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </header>
      )}

      <ol className="mx-auto mt-12 flex max-w-3xl items-center justify-between gap-2 px-2 text-xs font-semibold sm:text-sm" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={i === step ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs',
                i < step && 'border-foreground bg-foreground text-background',
                i === step && 'border-foreground bg-brand',
                i > step && 'border-border bg-card text-dim',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('hidden sm:inline', i > step && 'text-dim')}>{s}</span>
            {i < 2 && <span className="h-0.5 flex-1 rounded bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <section
        ref={card}
        id="make"
        className={cn(
          'relative z-10 mx-auto mt-4 scroll-mt-24 rounded-[32px] border border-border bg-card p-5 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.05)] sm:p-10',
          // editor gets room for preview + controls side by side
          step === 1 ? 'max-w-5xl' : 'max-w-3xl',
        )}
      >
        {step === 0 && <ChooseClip placeholder={placeholder} />}
        {step === 1 && current && <StickerEditor current={current} />}
        {step === 2 && current?.gif && <StickerReady current={current} made={made} />}
      </section>

      <section className="mx-auto mt-24 max-w-5xl" aria-labelledby="how">
        <div className="text-center">
          <span className={`inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold ${INK_SHADOW}`}>How it works</span>
          <h2 id="how" className="mt-4 font-display text-[clamp(1.9rem,6vw,2.25rem)] leading-tight font-bold tracking-tight text-balance">
            From clip to chat in three steps.
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {HOW.map(([title, body], i) => (
            <li key={title} className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-[0_8px_30px_rgb(0_0_0/0.04)]">
              <span className={`grid size-12 place-items-center rounded-xl bg-brand font-display text-xl font-bold ${INK_SHADOW}`}>{i + 1}</span>
              <h3 className="mt-6 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-16 flex max-w-5xl flex-col items-center justify-between gap-8 rounded-[24px] border border-border bg-card p-8 shadow-sm md:flex-row">
        <div className="text-center md:text-left">
          <h2 className="font-display text-2xl font-bold">Works with the usual suspects.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Paste a link, or pick any video or GIF from your phone.</p>
        </div>
        <ul className="flex flex-wrap justify-center gap-3">
          {['X (Twitter)', 'TikTok', 'Instagram', 'GIPHY'].map((s) => (
            <li key={s} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-bold">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-20 flex max-w-5xl flex-col gap-12 border-t border-foreground/5 pt-20 md:flex-row" aria-labelledby="faq">
        <div className="md:w-1/3">
          <span className={`inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold ${INK_SHADOW}`}>Good to know</span>
          <h2 id="faq" className="mt-4 font-display text-4xl font-bold tracking-tight">
            Before you ask.
          </h2>
        </div>
        <div className="flex flex-col gap-2 md:w-2/3">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group border-b border-foreground/10 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background text-sm transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pt-4 pr-8 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}

// ponytail: hand-picked from GIPHY trending + one viral X clip; swap files in public/hero when they go stale
export const HERO_CLIPS = [
  { src: '/hero/travolta.mp4', tag: 'wait what', at: 'top-0 left-4 rotate-[-12deg]' },
  { src: '/hero/liotta.mp4', tag: 'LMAO', at: 'top-52 -left-4 rotate-[8deg] [animation-delay:-2s]' },
  { src: '/hero/obajeeeeeee.mp4', tag: 'us fr', at: 'top-[24rem] -left-2 rotate-[-6deg] [animation-delay:-4s]' },
  { src: '/hero/costanza.mp4', tag: 'yesss', at: 'top-4 right-6 rotate-[8deg] [animation-delay:-1s]' },
  { src: '/hero/harold.mp4', tag: 'it’s fine', at: 'top-56 -right-2 rotate-[-5deg] [animation-delay:-3s]' },
]

// hard offset "sticker" shadow used across the page
const INK_SHADOW = 'shadow-[2px_2px_0_var(--foreground)]'
const INK_SHADOW_LG = 'shadow-[4px_4px_0_var(--foreground)]'

const FAQ = [
  ['Does it work on iPhone and Android?', 'Yes. It runs in Safari or Chrome, no app to install. Hold the finished sticker, tap Copy image, and paste it into a WhatsApp chat.'],
  ['Does it work in WhatsApp Web?', 'Not really. WhatsApp Web can’t paste animated stickers, so make and send them from your phone.'],
  ['Is gifdrop free?', 'Yes. No watermark, no sign-up, no limits.'],
  ['Are my clips uploaded anywhere?', 'No. The sticker is built on your device. Links are only fetched so your phone can grab the clip.'],
  ['Why did it send as a picture, not a sticker?', 'WhatsApp skips the “Custom sticker” preview for big files. Make it again in Compact or a shorter length.'],
] as const

function ChooseClip({ placeholder }: { placeholder: string }) {
  const { register, handleSubmit, setValue, watch, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { link: '' },
  })
  const link = watch('link')
  const busy = formState.isSubmitting

  const onSubmit = handleSubmit(async ({ link: l }) => {
    await toast
      .promise(fetchLink(l), { loading: 'Grabbing your clip…', success: 'Got it', error: (e: Error) => e.message })
      .catch(() => {})
  })

  // on phones there's no global paste, so a button reads the clipboard: copy on X, tap Paste here
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

  // desktop: paste anywhere, a copied GIF file or a link
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files[0]
      if (file) return loadFile(file, 'pasted')
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
      <h2 className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl">What are we stickering today?</h2>
      <span aria-hidden className={`mx-auto mt-8 grid size-16 rotate-3 place-items-center rounded-2xl bg-brand ${INK_SHADOW_LG}`}>
        <PixelarticonsLink className="size-8" />
      </span>

      <form onSubmit={onSubmit} noValidate className="mx-auto mt-6 max-w-xl">
        <label htmlFor="link" className="mb-3 block text-center text-xl font-bold">
          Paste a video or GIF link
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
            placeholder={placeholder}
            aria-invalid={!!formState.errors.link || undefined}
            aria-describedby={formState.errors.link ? 'link-error' : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-dim"
            {...register('link')}
          />
          {link ? (
            <Button type="submit" disabled={busy} className="h-12 shrink-0 rounded-full bg-foreground px-6 text-background hover:bg-black" aria-label="Load clip">
              {busy ? <PixelarticonsLoader className="animate-spin" /> : <PixelarticonsArrowRight />}
              <span className="hidden sm:inline">Load clip</span>
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

      <div className="mx-auto my-5 flex max-w-xl items-center gap-3 text-sm text-dim" aria-hidden>
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mx-auto max-w-xl">
        <DropZone onFile={(f) => loadFile(f, 'upload')} disabled={busy} />
      </div>
      <p className="mx-auto mt-8 w-fit rounded-full border border-border bg-background px-4 py-2 text-center text-xs font-medium text-muted-foreground">
        Made for WhatsApp on your phone. WhatsApp Web can’t paste stickers.
      </p>
    </>
  )
}
