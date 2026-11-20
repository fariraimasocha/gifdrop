# gifdrop

Send any GIF to WhatsApp, then turn it into an animated sticker.

**Live:** https://gifdrop.farirai.workers.dev

Paste an X post or GIPHY link (or drop a `.gif`/`.mp4`). gifdrop fetches the clip, converts X's MP4 "GIFs" into a real looping `.gif` in the browser (ffmpeg.wasm), and opens the phone's share sheet so it lands in WhatsApp as a GIF. In WhatsApp, press and hold the GIF → **Copy** → paste → **Send** and it goes as an animated sticker.

## Stack

TanStack Start · Cloudflare Workers · Tailwind v4 + shadcn/ui · zustand · react-hook-form + zod · react-hot-toast · ffmpeg.wasm

## How it works

- `src/routes/api/media.ts`: resolves a link to its media file and proxies it. Only allowlisted media hosts (twimg, giphy, tenor, imgur) are fetched; 25 MB cap; GIF/MP4 only; 20 requests/min per IP (Workers rate-limit binding). X posts are resolved via the public [fxtwitter](https://github.com/FixTweet/FxTwitter) API.
- `src/routes/twitter-video-downloader.tsx`: free X (Twitter) video downloader. `/api/x-video` lists every MP4 quality in a post (with real file sizes); `/api/x-video-file` streams the chosen file as a download. X's video CDN rejects requests carrying another site's `Referer`, so the file has to pass through the Worker; only `https://video.twimg.com/*.mp4` is ever fetched, and both endpoints share the 20/min rate limit. Logic lives in `src/lib/xvideo.ts`.
- `src/lib/convert.ts`: MP4 → animated GIF in the browser. The ~30 MB ffmpeg core loads only when needed.
- `src/lib/client.ts`: Web Share API on phones, download on desktop.

## Develop

```bash
pnpm install
pnpm dev                                   # http://localhost:3000
node --experimental-strip-types src/lib/media.test.ts   # link resolver self-check
node --experimental-strip-types src/lib/xvideo.test.ts  # X video downloader self-check
pnpm run deploy                            # build + wrangler deploy
```
