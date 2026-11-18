// Any clip → a square, transparent-padded, looping GIF small enough that WhatsApp offers it
// as a "Custom sticker" when pasted into a chat (big GIFs paste as plain GIFs).
// ffmpeg.wasm (~30 MB core) is only fetched when a clip is converted, then cached by the browser.
import type { FFmpeg } from '@ffmpeg/ffmpeg'

const CORE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
// ponytail: WhatsApp's paste-as-sticker cutoff isn't documented; ~500 KB matches its sticker limit
export const TARGET = 500 * 1024

// ponytail: fixed ladder, measured on real clips. Starts at the size the user picked and steps
// down until WhatsApp will take it as a sticker. Last rung is returned even if over.
const LADDER = [
  { side: 512, fps: 12, colors: 128 },
  { side: 400, fps: 10, colors: 64 },
  { side: 320, fps: 10, colors: 64 },
  { side: 256, fps: 8, colors: 48 },
]

export type StickerOptions = { start: number; secs: number; side: 512 | 320; crop: boolean }
export const DEFAULTS: StickerOptions = { start: 0, secs: 3, side: 512, crop: false }
export const MAX_SECS = 4

let ffmpeg: Promise<FFmpeg> | null = null

function load() {
  ffmpeg ??= (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import('@ffmpeg/ffmpeg'), import('@ffmpeg/util')])
    const f = new FFmpeg()
    await f.load({
      coreURL: await toBlobURL(`${CORE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    return f
  })().catch((e: unknown) => {
    ffmpeg = null // let the next try retry after a network blip
    throw e
  })
  return ffmpeg
}

export async function toSticker(
  file: File,
  o: StickerOptions = DEFAULTS,
  onStage?: (s: string) => void,
): Promise<{ file: File; side: number }> {
  onStage?.('Warming up…')
  const f = await load()
  const input = file.type === 'image/gif' ? 'in.gif' : 'in.mp4'
  await f.writeFile(input, new Uint8Array(await file.arrayBuffer()))

  try {
    let out: Uint8Array | null = null
    let side: number = o.side
    for (const [i, a] of LADDER.filter((r) => r.side <= o.side).entries()) {
      side = a.side
      onStage?.(i === 0 ? 'Making your sticker…' : 'Squeezing it for WhatsApp…')
      // fit = whole clip, padded with transparency; crop = fill the square, trim the edges
      const frame = o.crop
        ? `scale=w=${side}:h=${side}:force_original_aspect_ratio=increase:flags=lanczos,crop=${side}:${side},setsar=1,format=rgba,`
        : `scale=w=${side}:h=${side}:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1,format=rgba,` +
          `pad=w=${side}:h=${side}:x=-1:y=-1:color=black@0,`
      const vf =
        `fps=${a.fps},${frame}split[a][b];` +
        `[a]palettegen=max_colors=${a.colors}:reserve_transparent=1:stats_mode=diff[p];` +
        `[b][p]paletteuse=dither=none:alpha_threshold=128:diff_mode=rectangle`
      const code = await f.exec(['-ss', String(o.start), '-t', String(o.secs), '-i', input, '-vf', vf, '-loop', '0', '-an', '-y', 'out.gif'])
      if (code !== 0) throw new Error('Couldn’t convert this one. Try another clip.')
      out = (await f.readFile('out.gif')) as Uint8Array
      if (out.byteLength <= TARGET) break
    }
    return { file: new File([out!.slice()], `gifdrop-sticker-${Date.now()}.gif`, { type: 'image/gif' }), side }
  } finally {
    await f.deleteFile(input).catch(() => {})
    await f.deleteFile('out.gif').catch(() => {})
  }
}
