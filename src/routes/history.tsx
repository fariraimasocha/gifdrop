import { useEffect, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { PixelarticonsDownload } from '#/components/icons/pixelarticons/download'
import { PixelarticonsReload } from '#/components/icons/pixelarticons/reload'
import { HERO_CLIPS } from '#/components/converter'
import { useGif } from '#/stores/gif'
import { download, fetchLink } from '#/lib/client'
import { MAX, clearStickers, deleteSticker, listStickers, restoreStickers } from '#/lib/stickers'
import type { Saved } from '#/lib/stickers'

export const Route = createFileRoute('/history')({
  head: () => ({ meta: [{ title: 'My stickers | gifdrop' }] }),
  component: HistoryPage,
})

// die-cut look: a white outline that follows the sticker's transparent edges, then a soft lift
const DIE_CUT =
  '[filter:drop-shadow(2px_0_0_#fff)_drop-shadow(-2px_0_0_#fff)_drop-shadow(0_2px_0_#fff)_drop-shadow(0_-2px_0_#fff)_drop-shadow(0_10px_14px_rgb(0_0_0/0.14))]'

// same sticker always lands at the same tilt and height, so the board doesn't reshuffle on every visit
const scatter = (n: number) => ({ rotate: `${((n * 37) % 15) - 7}deg`, marginTop: `${((n * 53) % 5) * 8}px`, animationDelay: `${-((n * 7) % 5)}s` })

type Shown = Saved & { url: string }

function HistoryPage() {
  const history = useGif((s) => s.history)
  const made = useGif((s) => s.made)
  const clearLinks = useGif((s) => s.clearHistory)
  const navigate = useNavigate()
  const [stickers, setStickers] = useState<Shown[] | null>(null)

  const load = () =>
    listStickers()
      .then((all) => setStickers(all.map((s) => ({ ...s, url: URL.createObjectURL(s.blob) }))))
      .catch(() => setStickers([]))

  useEffect(() => {
    void load()
  }, [])
  useEffect(() => () => stickers?.forEach((s) => URL.revokeObjectURL(s.url)), [stickers])

  const reuse = (link: string) =>
    toast
      .promise(fetchLink(link), { loading: 'Grabbing…', success: 'Ready to send', error: (e: Error) => e.message })
      .then(() => navigate({ to: '/', hash: 'make' }))
      .catch(() => {})

  // deleting is instant, so it has to be reversible: the toast says what happened and offers the way back
  const undoable = (message: string, undo: () => Promise<void>) =>
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          {message}
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id)
              void undo().then(load)
            }}
            className="font-bold underline decoration-brand decoration-[3px] underline-offset-4"
          >
            Undo
          </button>
        </span>
      ),
      { duration: 8000 },
    )

  const remove = async ({ url: _url, ...sticker }: Shown) => {
    await deleteSticker(sticker.id)
    void load()
    undoable('Sticker deleted', () => restoreStickers([sticker]))
  }

  const clearAll = async () => {
    const kept = (stickers ?? []).map(({ url: _url, ...s }) => s)
    const links = history
    await clearStickers()
    clearLinks()
    void load()
    undoable('Everything cleared', async () => {
      await restoreStickers(kept)
      useGif.setState({ history: links })
    })
  }

  const empty = stickers?.length === 0 && history.length === 0

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-24 sm:px-6 sm:pt-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            {/* no count until the board has loaded: "0 stickers" for a moment would look like they were lost */}
            {stickers && `${stickers.length} sticker${stickers.length === 1 ? '' : 's'} · `}
            {made > (stickers?.length ?? made) && `${made} made in total · `}
            saved only in this browser
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.25rem)] leading-none font-semibold tracking-[-0.03em]">My stickers</h1>
        </div>
        {!empty && (
          <button type="button" onClick={clearAll} className="h-10 rounded-full border border-border px-4 text-sm font-semibold text-muted-foreground hover:border-foreground hover:text-foreground">
            Clear all
          </button>
        )}
      </header>

      {stickers && stickers.length > 0 && (
        <>
          <p className="mt-6 inline-flex rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-mint-ink">
            <span className="pointer-coarse:hidden">Right-click a sticker → Copy image, then paste in WhatsApp</span>
            <span className="hidden pointer-coarse:inline">Hold a sticker → Copy image, then paste in WhatsApp</span>
          </p>
          <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-14 sm:gap-x-12">
            {stickers.map((s) => (
              <li key={s.id} className="group flex flex-col items-center">
                <div className="animate-bob transition-transform duration-300 group-hover:!rotate-0 group-hover:scale-110" style={scatter(s.id)}>
                  {/* plain <img>: long-press "Copy image" keeps the animation */}
                  <img src={`${s.url}#gifdrop.gif`} alt="Your sticker" className={`size-32 object-contain [-webkit-touch-callout:default] sm:size-40 ${DIE_CUT}`} />
                </div>
                <div className="mt-4 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => download(new File([s.blob], `gifdrop-${s.id}.gif`, { type: s.blob.type }))} aria-label="Download" className="grid size-9 place-items-center rounded-full border border-border bg-card hover:border-foreground">
                    <PixelarticonsDownload className="size-4" />
                  </button>
                  {s.link && (
                    <button type="button" onClick={() => reuse(s.link!)} aria-label="Remake from link" className="grid size-9 place-items-center rounded-full border border-border bg-card hover:border-foreground">
                      <PixelarticonsReload className="size-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => remove(s)} aria-label="Delete" className="grid size-9 place-items-center rounded-full border border-border bg-card text-lg leading-none hover:border-foreground">
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {stickers.length >= MAX && (
            <p className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
              This board keeps your newest {MAX} stickers. Download any you want to keep for good.
            </p>
          )}
        </>
      )}

      {stickers?.length === 0 && (
        // bottomless pit: an empty board still points at the next sticker
        <section className="relative mt-10 overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:py-24">
          <div aria-hidden className="pointer-events-none mb-10 flex flex-wrap justify-center gap-6 sm:gap-10">
            {HERO_CLIPS.map((c, i) => (
              <div key={c.src} className="animate-bob opacity-90" style={scatter(i + 3)}>
                <video src={c.src} autoPlay loop muted playsInline preload="metadata" className="size-20 rounded-2xl border-4 border-card object-cover shadow-xl sm:size-24" />
              </div>
            ))}
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em]">Your stickers land here.</h2>
          <p className="mx-auto mt-3 max-w-sm text-muted-foreground">Every sticker you make is saved on this device, ready to copy into WhatsApp again.</p>
          <Link to="/" hash="make" className="mt-8 inline-flex h-12 items-center rounded-full bg-foreground px-6 font-semibold text-background hover:bg-black">
            Make your first sticker →
          </Link>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-20" aria-labelledby="links">
          <h2 id="links" className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Links you've converted
          </h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {history.map((h) => (
              <li key={h.link} className="flex items-center gap-3 py-3 pr-3 pl-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{h.link}</p>
                  <p className="font-mono text-[11px] text-dim">{new Date(h.at).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => reuse(h.link)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold hover:border-foreground">
                  <PixelarticonsReload className="size-4" /> <span className="hidden sm:inline">Use again</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
