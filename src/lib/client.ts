import toast from 'react-hot-toast'
import { useGif } from '#/stores/gif'
import { ACCEPT } from '#/components/drop-zone'

const MAX = 25 * 1024 * 1024
const ext = (type: string) => (type === 'video/mp4' ? 'mp4' : 'gif')

export function loadFile(file: File, source: string) {
  if (!ACCEPT.split(',').includes(file.type)) return toast.error('That isn’t a GIF or video.')
  if (file.size > MAX) return toast.error('That file is too big (max 25 MB).')
  useGif.getState().setCurrent({ file, previewUrl: URL.createObjectURL(file), source })
}

export async function fetchLink(link: string) {
  const res = await fetch(`/api/media?url=${encodeURIComponent(link)}`)
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(error ?? 'Something went wrong.')
  }
  const blob = await res.blob()
  const file = new File([blob], `gifdrop-${Date.now()}.${ext(blob.type)}`, { type: blob.type })
  loadFile(file, link)
  useGif.getState().remember(link)
}

export function download(file: File) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
