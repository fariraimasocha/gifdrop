import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/help')({ component: Help })

const STEPS = [
  ['01', 'Copy the link', 'Tap share on the X post (or GIPHY/Tenor GIF) and copy the link.'],
  ['02', 'Paste it here', 'gifdrop finds the clip and turns it into a real GIF. You can also drop or pick the file itself.'],
  ['03', 'Send or save it', 'Tap Send GIF and pick any chat (your own works), or tap Save to download it to your phone.'],
  ['04', 'Create sticker in WhatsApp', 'Open WhatsApp, tap the sticker icon in the message box, then Create, and pick the GIF. Or tap the GIF in the chat and choose Create sticker. Send it and it’s saved to your stickers.'],
] as const

function Help() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <h1 className="font-pixel text-4xl text-foreground">How it works</h1>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {STEPS.map(([n, title, body]) => (
          <li key={n} className="rounded-lg bg-card p-5 shadow-[inset_0_0_0_1px_var(--border)]">
            <p className="font-mono text-[11px] text-brand">{n}</p>
            <h2 className="mt-3 text-[15px] font-medium text-foreground">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-lg p-5 shadow-[inset_0_0_0_1px_var(--border)]">
        <h2 className="text-[15px] font-medium text-foreground">Can’t find it in Create sticker?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Tap Send GIF and choose <span className="text-foreground">Save Image</span> so it lands in Photos, which is where Create sticker looks. Still stuck? Send it to your own chat first, then tap it there and choose Create sticker.
        </p>
      </div>
    </main>
  )
}
