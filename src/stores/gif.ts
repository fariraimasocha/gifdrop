import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Media = { file: File; previewUrl: string }
export type Current = Media & { source: string; gif?: Media }
export type HistoryItem = { link: string; at: number }

type GifState = {
  current: Current | null
  history: HistoryItem[]
  setCurrent: (c: Current | null) => void
  setGif: (file: File) => void
  remember: (link: string) => void
  clearHistory: () => void
}

const revoke = (c: Current | null) => {
  if (!c) return
  URL.revokeObjectURL(c.previewUrl)
  if (c.gif && c.gif.previewUrl !== c.previewUrl) URL.revokeObjectURL(c.gif.previewUrl)
}

export const useGif = create<GifState>()(
  persist(
    (set, get) => ({
      current: null,
      history: [],
      setCurrent: (c) => {
        revoke(get().current)
        set({ current: c })
      },
      setGif: (file) => {
        const cur = get().current
        if (!cur) return
        // already a gif: reuse the original preview instead of a second blob URL
        const previewUrl = file === cur.file ? cur.previewUrl : URL.createObjectURL(file)
        set({ current: { ...cur, gif: { file, previewUrl } } })
      },
      remember: (link) =>
        set({ history: [{ link, at: Date.now() }, ...get().history.filter((h) => h.link !== link)].slice(0, 30) }),
      clearHistory: () => set({ history: [] }),
    }),
    // only links persist; files and blob URLs die with the tab
    { name: 'gifdrop', partialize: (s) => ({ history: s.history }) },
  ),
)
