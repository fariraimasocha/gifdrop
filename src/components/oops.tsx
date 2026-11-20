import { Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

// The two worst screens (unknown page, crash) look like the rest of the site and always answer:
// what went wrong, is my work safe, what now.
function Oops({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-24 sm:px-6 sm:pt-16">
      <section className="rounded-[32px] border border-border bg-card px-6 py-16 text-center sm:py-20">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
      </section>
    </main>
  )
}

const primary = 'inline-flex h-12 items-center rounded-full bg-foreground px-6 font-semibold text-background hover:bg-black'
const secondary = 'inline-flex h-12 items-center rounded-full border-2 border-border bg-card px-6 font-semibold hover:border-foreground'

export function NotFound() {
  return (
    <Oops title="This page doesn’t exist." body="The link may be old or mistyped. Your saved stickers are not affected.">
      <Link to="/" hash="make" className={primary}>
        Make a sticker →
      </Link>
      <Link to="/history" className={secondary}>
        My stickers
      </Link>
    </Oops>
  )
}

export function Crashed({ reset }: ErrorComponentProps) {
  return (
    <Oops title="Something broke on our side." body="Your saved stickers are still in this browser. Try again, and if it keeps happening, reload the page.">
      <Button type="button" size="lg" onClick={reset}>
        Try again
      </Button>
      <Link to="/" className={secondary}>
        Back to the start
      </Link>
    </Oops>
  )
}
