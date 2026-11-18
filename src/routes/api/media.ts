import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { ALLOWED_TYPES, MAX_BYTES, classify, isAllowedMediaUrl, resolveInstagram, resolveTikTok, resolveTweet } from '#/lib/media'

const Query = z.object({ url: z.string().min(8).max(2048) })

const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } })

export const Route = createFileRoute('/api/media')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ip = request.headers.get('cf-connecting-ip') ?? 'local'
        if (!(await env.MEDIA_LIMITER.limit({ key: ip })).success) {
          return fail(429, 'Slow down a little and try again in a minute.')
        }

        const parsed = Query.safeParse(Object.fromEntries(new URL(request.url).searchParams))
        if (!parsed.success) return fail(400, 'Paste a valid link.')

        const target = classify(parsed.data.url)
        if (target.kind === 'invalid') {
          return fail(400, 'Use an X, TikTok, Instagram, GIPHY or Tenor link.')
        }

        const mediaUrl =
          target.kind === 'tweet'
            ? await resolveTweet(target.id)
            : target.kind === 'tiktok'
              ? await resolveTikTok(target.url)
              : target.kind === 'instagram'
                ? await resolveInstagram(target.id)
                : target.url
        if (!mediaUrl) return fail(404, "Couldn't find a GIF or video in that post.")

        const upstream = await fetch(mediaUrl, { redirect: 'follow' })
        // a redirect could leave the allowlist, so check where we actually ended up
        if (!upstream.ok || !isAllowedMediaUrl(upstream.url)) return fail(502, "Couldn't download that file.")

        const type = (upstream.headers.get('content-type') ?? '').split(';')[0].trim()
        const size = Number(upstream.headers.get('content-length') ?? 0)
        if (!ALLOWED_TYPES.includes(type)) return fail(415, "That link isn't a GIF or video.")
        if (!size || size > MAX_BYTES) return fail(413, 'That file is too big (max 25 MB).')

        return new Response(upstream.body, {
          headers: {
            'content-type': type,
            'content-length': String(size),
            'cache-control': 'private, max-age=3600',
            'x-content-type-options': 'nosniff',
            'content-disposition': 'attachment',
          },
        })
      },
    },
  },
})
