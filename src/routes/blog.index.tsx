import { Link, createFileRoute } from '@tanstack/react-router'
import { POSTS } from '#/content/posts'
import { SITE_URL } from '#/lib/site'

const TITLE = 'WhatsApp sticker guides | gifdrop blog'
const DESCRIPTION = 'How to turn GIFs, TikToks, Reels and X clips into animated WhatsApp stickers, plus fixes for when they send as GIFs.'

export const Route = createFileRoute('/blog/')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/blog` }],
  }),
  component: Blog,
})

function Blog() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em]">Sticker guides</h1>
      <p className="mt-3 text-[17px] text-muted-foreground">Everything about getting clips into WhatsApp as stickers.</p>
      <ul className="mt-8 grid gap-3">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="block rounded-[24px] border border-border bg-card p-5 transition hover:border-foreground"
            >
              <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">{p.title}</h2>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
