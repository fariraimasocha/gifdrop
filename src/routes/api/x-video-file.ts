import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { downloadName, isTwitterVideoUrl } from '#/lib/xvideo'

const Query = z.object({ file: z.string().min(8).max(2048), name: z.string().max(200).optional() })

const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } })

// Streams one X video file as a download. X's CDN refuses requests that carry another site's Referer,
// so the browser can't fetch it directly; the Worker does, and passes the bytes straight through.
export const Route = createFileRoute('/api/x-video-file')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ip = request.headers.get('cf-connecting-ip') ?? 'local'
        if (!(await env.MEDIA_LIMITER.limit({ key: ip })).success) {
          return fail(429, 'Slow down a little and try again in a minute.')
        }

        const parsed = Query.safeParse(Object.fromEntries(new URL(request.url).searchParams))
        if (!parsed.success || !isTwitterVideoUrl(parsed.data.file)) return fail(400, "That isn't an X video file.")

        const upstream = await fetch(parsed.data.file, { redirect: 'follow' })
        // a redirect could leave X's CDN, so check where we actually ended up
        if (!upstream.ok || !isTwitterVideoUrl(upstream.url)) return fail(502, "Couldn't download that video.")

        const type = (upstream.headers.get('content-type') ?? '').split(';')[0].trim()
        if (type !== 'video/mp4') return fail(415, "That file isn't a video.")

        const headers = new Headers({
          'content-type': 'video/mp4',
          'content-disposition': `attachment; filename="${downloadName(parsed.data.name)}"`,
          'cache-control': 'private, max-age=3600',
          'x-content-type-options': 'nosniff',
        })
        // lets the browser show real download progress
        const size = upstream.headers.get('content-length')
        if (size) headers.set('content-length', size)

        return new Response(upstream.body, { headers })
      },
    },
  },
})
