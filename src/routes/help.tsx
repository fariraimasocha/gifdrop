import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/help')({ component: Help })

const STEPS = [
  ['01', 'Copy the link', 'Tap share on the X, TikTok or Instagram post (or a GIPHY GIF) and copy the link. Or just pick a video from your phone.'],
  ['02', 'Keep the best bit', 'Paste it into gifdrop, drag to the moment you want (up to 4 seconds), and tap Make a sticker. It converts on your phone.'],
  ['03', 'Copy the sticker', 'Press and hold the animation, then tap Copy image.'],
  ['04', 'Paste in WhatsApp', 'Open any chat, hold the message box, tap Paste. WhatsApp shows “Custom sticker”. Send it, then tap it to save to Favorites.'],
] as const

function Help() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-foreground">How it works</h1>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {STEPS.map(([n, title, body]) => (
          <li key={n} className="rounded-[24px] border border-border bg-card p-5 ">
            <p className="font-display text-lg font-extrabold text-brand-deep">{n}</p>
            <h2 className="mt-3 text-[15px] font-medium text-foreground">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-[24px] bg-muted p-5">
        <h2 className="text-[17px] font-semibold text-foreground">It pasted as a GIF, not a sticker?</h2>
        <p className="mt-1.5 leading-relaxed text-muted-foreground">
          WhatsApp only turns small files into stickers. Make it again with Compact resolution or a shorter clip, then copy and paste again. WhatsApp Web can’t do this, use your phone.
        </p>
      </div>
    </main>
  )
}
