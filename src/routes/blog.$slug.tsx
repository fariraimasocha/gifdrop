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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-20 sm:pt-12">
      <Link to="/blog" className="text-[15px] font-semibold underline decoration-brand decoration-[3px] underline-offset-4">
        ← All guides
      </Link>
      <h1 className="mt-5 font-display text-[clamp(2rem,8vw,2.8rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">{p.title}</h1>
      <p className="mt-3 text-sm text-dim">
        <time dateTime={p.date}>{new Date(p.date).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
      </p>

      {/* own static content through an escaping renderer (#/lib/md), so innerHTML is safe here */}
      <article className="prose-post mt-8" dangerouslySetInnerHTML={{ __html: md(p.body) }} />

      <section className="mt-10 rounded-[28px] border-2 border-foreground bg-brand p-6 shadow-[0_5px_0_var(--foreground)]">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Make one now. It takes 30 seconds.</h2>
        <p className="mt-1">Paste a link or pick a clip. Free, no app, no watermark.</p>
        <Link to="/" hash="make" className="mt-4 inline-flex h-12 items-center rounded-full bg-foreground px-6 font-semibold text-background">
          Make a sticker →
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Questions</h2>
        <dl className="mt-4 grid gap-3">
          {p.faq.map(([q, a]) => (
            <div key={q} className="rounded-[20px] bg-muted p-5">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Keep reading</h2>
        <ul className="mt-4 grid gap-3">
          {more.map((x) => (
            <li key={x.slug}>
              <Link to="/blog/$slug" params={{ slug: x.slug }} className="block rounded-[20px] border border-border bg-card p-4 font-semibold hover:border-foreground">
                {x.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
