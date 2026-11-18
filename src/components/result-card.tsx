import { forwardRef, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Loader2, Send, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useGif } from '#/stores/gif'
import type { Current } from '#/stores/gif'
import { save, sendToWhatsApp } from '#/lib/client'
import { toGif } from '#/lib/convert'

const size = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

const STEPS = [
  ['Send', 'Tap the button below and pick a chat in WhatsApp.'],
  ['Copy', 'In the chat, press and hold the GIF, then tap Copy (under More if you don’t see it).'],
  ['Paste', 'Paste into the message box and tap Send. It goes as an animated sticker.'],
] as const

export const ResultCard = forwardRef<HTMLElement, { current: Current }>(function ResultCard({ current }, ref) {
  const setCurrent = useGif((s) => s.setCurrent)
  const setGif = useGif((s) => s.setGif)
  const [stage, setStage] = useState<string | null>(null)
  const gif = current.gif

  // Start converting as soon as the clip loads. iOS only allows the share sheet right
  // after a tap, so the GIF has to be ready before the user presses Send.
  useEffect(() => {
    if (gif) return
    const source = current.file
    let live = true
    toGif(source, (s) => live && setStage(s))
      .then((f) => {
        if (live && useGif.getState().current?.file === source) setGif(f)
      })
      .catch((e: Error) => live && toast.error(e.message || 'Couldn’t turn this into a GIF.'))
      .finally(() => live && setStage(null))
    return () => {
      live = false
    }
  }, [current.file, gif, setGif])

  const shown = gif ?? current

  return (
    <section ref={ref} aria-label="Your GIF" className="scroll-mt-20 overflow-hidden rounded-lg bg-card shadow-[inset_0_0_0_1px_var(--border)]">
      <div className="flex items-center justify-between border-b border-[#1f1f22] py-1 pr-1 pl-4">
        <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-dim" aria-live="polite">
          {gif ? (
            <>
              <span className="size-1.5 rounded-full bg-brand" aria-hidden /> gif · {size(gif.file.size)} · ready
            </>
          ) : (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden /> {stage ?? 'Preparing…'}
            </>
          )}
        </p>
        <Button variant="ghost" size="icon" onClick={() => setCurrent(null)} aria-label="Clear">
          <X />
        </Button>
      </div>

      <div className="m-3 grid place-items-center rounded-md bg-[#0c0c0e] p-3 sm:mx-4">
        {shown.file.type === 'video/mp4' ? (
          <video src={shown.previewUrl} autoPlay loop muted playsInline className="max-h-[40svh] w-auto max-w-full rounded-md sm:max-h-[340px]" />
        ) : (
          <img src={shown.previewUrl} alt="Your GIF preview" className="max-h-[40svh] w-auto max-w-full rounded-md sm:max-h-[340px]" />
        )}
      </div>

      <div className="mx-3 mb-3 rounded-md bg-[#0c0c0e] p-4 shadow-[inset_0_0_0_1px_#1f1f22] sm:mx-4 sm:mb-4">
        <p className="font-mono text-[11px] text-brand">make it a sticker</p>
        <ol className="mt-3 grid gap-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-muted font-mono text-[10px] text-muted-foreground">{i + 1}</span>
              <p className="text-[13px] leading-snug text-muted-foreground">
                <span className="text-foreground">{title}.</span> {body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* phones: actions pinned to the bottom, in thumb reach, above the home indicator */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[#1f1f22] bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:static sm:z-auto sm:bg-transparent sm:p-3 sm:backdrop-blur-none">
        <Button variant="brand" size="lg" className="h-12 flex-1 text-[13px] sm:h-11 sm:text-xs" disabled={!gif} onClick={() => gif && sendToWhatsApp(gif.file)}>
          {gif ? <Send /> : <Loader2 className="animate-spin" />}
          {gif ? 'Send GIF to WhatsApp' : (stage ?? 'Preparing GIF…')}
        </Button>
        <Button variant="secondary" size="lg" className="size-12 px-0 sm:h-11 sm:w-auto sm:px-5" disabled={!gif} onClick={() => gif && save(gif.file)} aria-label="Save GIF">
          <Download /> <span className="hidden sm:inline">Save</span>
        </Button>
      </div>
    </section>
  )
})
