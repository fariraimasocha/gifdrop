import { createFileRoute, useNavigate } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { PixelarticonsReload } from '#/components/icons/pixelarticons/reload'
import { Button } from '#/components/ui/button'
import { useGif } from '#/stores/gif'
import { fetchLink } from '#/lib/client'

export const Route = createFileRoute('/history')({ component: HistoryPage })

function HistoryPage() {
  const history = useGif((s) => s.history)
  const clear = useGif((s) => s.clearHistory)
  const navigate = useNavigate()

  const reuse = (link: string) =>
    toast
      .promise(fetchLink(link), { loading: 'Grabbing…', success: 'Ready to send', error: (e: Error) => e.message })
      .then(() => navigate({ to: '/' }))
      .catch(() => {})

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-foreground">History</h1>
          <p className="mt-2 text-sm text-muted-foreground">Links you've converted. Stored only in this browser.</p>
        </div>
        {history.length > 0 && (
          <Button variant="secondary" onClick={clear} className="h-10 sm:h-8">
            Clear
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="mt-10 rounded-lg p-8 text-center font-mono text-xs text-dim ">
          nothing yet. paste a link on Convert
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-[24px] border border-border bg-card ">
          {history.map((h) => (
            <li key={h.link} className="flex items-center gap-3 py-2.5 pr-2 pl-4 sm:py-3 sm:pr-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{h.link}</p>
                <p className="font-mono text-[11px] text-dim">{new Date(h.at).toLocaleString()}</p>
              </div>
              <Button variant="secondary" onClick={() => reuse(h.link)} aria-label="Use again" className="size-11 shrink-0 px-0 sm:h-8 sm:w-auto sm:px-3">
                <PixelarticonsReload /> <span className="hidden sm:inline">Use again</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
