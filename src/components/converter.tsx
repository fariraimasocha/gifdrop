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
    <main className="mx-auto w-full max-w-xl px-4 pt-8 pb-16 sm:pt-14">
      {/* hero shrinks away once a clip is loaded: the work is the page now */}
      {step === 0 && (
        <header className="text-center">
          <span className="inline-block -rotate-3 rounded-2xl border-2 border-foreground bg-brand px-4 py-1.5 font-display text-sm font-extrabold shadow-[0_3px_0_var(--foreground)]">
            {eyebrow}
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.4rem,10vw,3.6rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            {headline} <span className="bg-[linear-gradient(transparent_62%,var(--brand)_62%)]">into a WhatsApp sticker.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">{blurb}</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-medium">
            {['No sign-up', 'Converts on your device', 'Free, no watermark'].map((t) => (
              <li key={t} className="rounded-full border border-border bg-card px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
        </header>
      )}

      <ol className="mt-8 flex items-center justify-between gap-2 px-2 text-xs font-semibold sm:text-sm" aria-label="Progress">
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
        className="mt-4 scroll-mt-20 rounded-[28px] border border-border bg-card p-5 shadow-[0_1px_0_var(--border),0_12px_32px_-16px_rgb(23_21_15/0.15)] sm:p-8"
      >
        {step === 0 && <ChooseClip placeholder={placeholder} />}
        {step === 1 && current && <StickerEditor current={current} />}
        {step === 2 && current?.gif && <StickerReady current={current} made={made} />}
      </section>

      <section className="mt-20 text-center" aria-labelledby="how">
        <span className="rounded-full bg-brand px-3.5 py-1 text-sm font-bold">How it works</span>
        <h2 id="how" className="mt-4 font-display text-[clamp(1.8rem,7vw,2.4rem)] leading-tight font-extrabold tracking-[-0.03em] text-balance">
          From clip to chat in three steps.
        </h2>
        <ol className="mt-8 grid gap-3 text-left">
          {HOW.map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-[24px] border border-border bg-card p-5">
              <span className="grid size-11 shrink-0 -rotate-6 place-items-center rounded-xl bg-brand font-display text-lg font-extrabold shadow-[0_3px_0_var(--brand-deep)]">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-extrabold tracking-[-0.02em]">{title}</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

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
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.03em]">What are we stickering today?</h2>

      <form onSubmit={onSubmit} noValidate className="mt-5">
        <label htmlFor="link" className="mb-2 block text-[15px] font-semibold">
          Paste a link
        </label>
        <div className="flex h-16 items-center gap-2 rounded-2xl border-2 border-border bg-card pr-2 pl-4 focus-within:border-foreground">
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
            <Button type="submit" variant="brand" disabled={busy} className="h-12 shrink-0 px-4" aria-label="Load clip">
              {busy ? <PixelarticonsLoader className="animate-spin" /> : <PixelarticonsArrowRight />}
              <span className="hidden sm:inline">Load clip</span>
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={pasteFromClipboard} className="h-12 shrink-0 px-4">
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

      <div className="my-5 flex items-center gap-3 text-sm text-dim" aria-hidden>
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <DropZone onFile={(f) => loadFile(f, 'upload')} disabled={busy} />
      <p className="mt-4 text-center text-sm text-muted-foreground">Made for WhatsApp on your phone. WhatsApp Web can’t paste stickers.</p>
    </>
  )
}
