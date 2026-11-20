import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { classify } from '#/lib/media'
import { lookupPost } from '#/lib/downloader'

const Query = z.object({ url: z.string().min(8).max(2048) })

const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } })

// X, TikTok or Instagram post link → the videos in it and every MP4 we can offer
// (see /api/video-file for the download itself)
export const Route = createFileRoute('/api/video')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ip = request.headers.get('cf-connecting-ip') ?? 'local'
        if (!(await env.MEDIA_LIMITER.limit({ key: ip })).success) {
          return fail(429, 'Slow down a little and try again in a minute.')
        }

        const parsed = Query.safeParse(Object.fromEntries(new URL(request.url).searchParams))
        if (!parsed.success) return fail(400, 'Paste a valid link.')

        const post = await lookupPost(classify(parsed.data.url))
        if (!post) return fail(400, 'Paste a link to an X, TikTok or Instagram post.')
        if (post === 'missing') return fail(404, "Couldn't open that post. It may be private or deleted.")
        if (post === 'no-video') return fail(404, "That post doesn't have a video.")

        // short: TikTok and Instagram file links are signed and expire
        return Response.json(post, { headers: { 'cache-control': 'private, max-age=300' } })
      },
    },
  },
})
