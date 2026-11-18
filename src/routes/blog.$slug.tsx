import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { POSTS, getPost } from '#/content/posts'
import { md } from '#/lib/md'
import { SITE_URL } from '#/lib/site'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPost(params.slug)
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData: p }) => {
    if (!p) return {}
    const url = `${SITE_URL}/blog/${p.slug}`
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date, url, author: { '@type': 'Organization', name: 'gifdrop' } },
        { '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      ],
    }
    return {
      meta: [
        { title: `${p.title} | gifdrop` },
        { name: 'description', content: p.description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { property: 'og:title', content: p.title },
        { property: 'og:description', content: p.description },
      ],
      links: [{ rel: 'canonical', href: url }],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(schema) }],
    }
  },
  component: PostPage,
})

function PostPage() {
  const p = Route.useLoaderData()
  const more = POSTS.filter((x) => x.slug !== p.slug).slice(0, 3)
  const mins = Math.max(1, Math.round(p.body.split(/\s+/).length / 230))
  const date = new Date(p.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <main className="mx-auto w-full max-w-[44rem] px-4 pt-10 pb-24 sm:pt-16">
      <nav aria-label="Breadcrumb" className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
        <Link to="/blog" className="hover:text-foreground">
          ← Guides
        </Link>
      </nav>
      <h1 className="mt-6 font-display text-[clamp(2.1rem,6vw,3.25rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">{p.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{p.description}</p>
      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-border py-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        <span className="font-medium text-foreground">gifdrop</span>
        <span aria-hidden>·</span>
        <time dateTime={p.date}>{date}</time>
        <span aria-hidden>·</span>
        <span>{mins} min read</span>
      </p>

      {/* own static content through an escaping renderer (#/lib/md), so innerHTML is safe here */}
      <article className="prose-post mt-10" dangerouslySetInnerHTML={{ __html: md(p.body) }} />

      {/* bottomless pit: the end of the post is the start of a sticker */}
      <section className="mt-14 overflow-hidden rounded-2xl bg-foreground p-7 text-background sm:p-9">
        <p className="font-mono text-xs tracking-wider text-brand uppercase">Try it · 30 seconds</p>
        <h2 className="mt-3 font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">Make one now.</h2>
        <p className="mt-2 text-background/70">Paste a link or pick a clip. Free, no app, no watermark.</p>
        <Link
          to="/"
          hash="make"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink transition hover:bg-[#7fdcae]"
        >
          Make a sticker →
        </Link>
      </section>

      <section className="mt-16" aria-labelledby="questions">
        <h2 id="questions" className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Questions
        </h2>
        <div className="mt-4 border-t border-border">
          {p.faq.map(([q, a]) => (
            <details key={q} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-sm transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pt-3 pr-8 leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="more">
        <h2 id="more" className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Keep reading
        </h2>
        <ul className="mt-4 grid gap-3">
          {more.map((x) => (
            <li key={x.slug}>
              <Link
                to="/blog/$slug"
                params={{ slug: x.slug }}
                className="group flex items-start justify-between gap-6 rounded-xl border border-border bg-card p-5 transition hover:border-foreground"
              >
                <span>
                  <span className="block font-display text-lg leading-snug font-semibold tracking-[-0.01em]">{x.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{x.description}</span>
                </span>
                <span aria-hidden className="mt-1 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
