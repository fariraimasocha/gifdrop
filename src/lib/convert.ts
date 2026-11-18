// MP4 → real animated .gif, so WhatsApp receives it as a GIF (not a video or photo).
// In WhatsApp a GIF can then be long-pressed → Copy → pasted back to send it as an animated sticker.
// ffmpeg.wasm (~30 MB core) is only fetched when a clip actually needs converting, then cached by the browser.
import type { FFmpeg } from '@ffmpeg/ffmpeg'

const CORE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
const TARGET = 8 * 1024 * 1024

// ponytail: fixed ladder; first rung fits typical X GIF clips in one pass
const ATTEMPTS = [
  { fps: 15, width: 480, secs: 8 },
  { fps: 12, width: 400, secs: 8 },
  { fps: 10, width: 320, secs: 6 },
]

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

export async function toGif(file: File, onStage?: (s: string) => void): Promise<File> {
  if (file.type === 'image/gif') return file
  onStage?.('Loading converter…')
  const f = await load()
  const input = 'in.mp4'
  await f.writeFile(input, new Uint8Array(await file.arrayBuffer()))

  try {
    for (const [i, a] of ATTEMPTS.entries()) {
      onStage?.(i === 0 ? 'Making GIF…' : 'Shrinking GIF…')
      // one-pass palette: far better colours than ffmpeg's default 256-colour GIF
      const vf = `fps=${a.fps},scale='min(${a.width},iw)':-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`
      const code = await f.exec(['-t', String(a.secs), '-i', input, '-vf', vf, '-loop', '0', '-an', '-y', 'out.gif'])
      if (code !== 0) throw new Error('Couldn’t convert this one. Try another.')
      const out = (await f.readFile('out.gif')) as Uint8Array
      if (out.byteLength <= TARGET) return new File([out.slice()], `gifdrop-${Date.now()}.gif`, { type: 'image/gif' })
    }
    throw new Error('This clip is too long to turn into a GIF. Try a shorter one.')
  } finally {
    await f.deleteFile(input).catch(() => {})
    await f.deleteFile('out.gif').catch(() => {})
  }
}
