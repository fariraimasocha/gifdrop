import { useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowRight, ClipboardPaste, Link2, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { DropZone } from '#/components/drop-zone'
import { ResultCard } from '#/components/result-card'
import { useGif } from '#/stores/gif'
import { fetchLink, loadFile } from '#/lib/client'

export const Route = createFileRoute('/')({ component: Home })

const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v)

const schema = z.object({
  link: z.string().trim().min(1, 'Paste a link first').max(2048).refine(isLink, 'That doesn’t look like a link'),
})
type Form = z.infer<typeof schema>

function Home() {
  const current = useGif((s) => s.current)
  const { register, handleSubmit, setValue, watch, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { link: '' },
  })
  const link = watch('link')
  const preview = useRef<HTMLElement>(null)

  // phones: bring the loaded GIF into view instead of leaving it below the fold
  useEffect(() => {
    if (current && window.matchMedia('(max-width: 639px)').matches) {
      preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [current?.previewUrl])
  const busy = formState.isSubmitting

  const onSubmit = handleSubmit(async ({ link: l }) => {
    await toast
      .promise(fetchLink(l), { loading: 'Grabbing your GIF…', success: 'Ready to send', error: (e: Error) => e.message })
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
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-8 sm:pt-20 sm:pb-20">
      <p className="font-mono text-[11px] text-brand sm:text-xs">x · giphy · tenor → whatsapp</p>
      <h1 className="mt-3 font-pixel text-[clamp(2.25rem,11.5vw,4rem)] leading-[0.95] tracking-[-0.02em] text-balance text-foreground sm:mt-4">
        Any GIF,
        <br />
        <span className="text-brand">into WhatsApp.</span>
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:mt-5 sm:text-sm">
        Paste an X post or GIPHY link. Send it to WhatsApp as a real GIF, then turn it into an animated sticker in two taps.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 sm:mt-10">
        <label htmlFor="link" className="sr-only">
          Link to an X post or GIF
        </label>
        <div className="flex h-14 items-center gap-2 rounded-lg bg-card pr-1.5 pl-3.5 shadow-[inset_0_0_0_1px_var(--border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)] sm:h-12">
          <Link2 className="size-4 shrink-0 text-dim" aria-hidden />
          {/* 16px on mobile so iOS Safari doesn't zoom the page on focus */}
          <input
            id="link"
            type="url"
            inputMode="url"
            enterKeyHint="go"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Paste an X or GIF link"
            aria-invalid={!!formState.errors.link || undefined}
            aria-describedby={formState.errors.link ? 'link-error' : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-dim sm:text-sm"
            {...register('link')}
          />
          {link ? (
            <Button type="submit" disabled={busy} className="size-11 shrink-0 px-0 sm:h-9 sm:w-auto sm:px-3.5" aria-label="Get GIF">
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              <span className="hidden sm:inline">Get GIF</span>
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={pasteFromClipboard} className="h-11 shrink-0 px-3.5 sm:h-9">
              <ClipboardPaste /> Paste
            </Button>
          )}
        </div>
        {formState.errors.link && (
          <p id="link-error" role="alert" className="mt-2 font-mono text-[11px] text-destructive">
            {formState.errors.link.message}
          </p>
        )}
      </form>

      <div className="my-5 flex items-center gap-3 font-mono text-[11px] text-dim sm:my-6" aria-hidden>
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      {current ? (
        <ResultCard ref={preview} current={current} />
      ) : (
        <DropZone onFile={(f) => loadFile(f, 'upload')} disabled={busy} />
      )}
    </main>
  )
}
