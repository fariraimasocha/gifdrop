// Finished stickers, kept in IndexedDB (localStorage can't hold blobs). Per-browser only, nothing leaves the device.
// Piggy bank: the more you make, the more you'd lose by leaving.
export type Saved = { id: number; at: number; blob: Blob; link?: string }

const MAX = 60 // ponytail: oldest drop off past 60; stickers are <500 KB so this stays well under quota

function store(mode: IDBTransactionMode) {
  return new Promise<IDBObjectStore>((res, rej) => {
    const r = indexedDB.open('gifdrop', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('stickers', { keyPath: 'id', autoIncrement: true })
    r.onsuccess = () => res(r.result.transaction('stickers', mode).objectStore('stickers'))
    r.onerror = () => rej(r.error)
  })
}

const done = <T,>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })

export async function saveSticker(blob: Blob, link?: string) {
  await done((await store('readwrite')).add({ at: Date.now(), blob, link }))
  const keys = await done((await store('readonly')).getAllKeys())
  const extra = keys.slice(0, Math.max(0, keys.length - MAX))
  if (extra.length) {
    const s = await store('readwrite')
    extra.forEach((k) => s.delete(k))
  }
}

export const listStickers = async () => ((await done((await store('readonly')).getAll())) as Saved[]).reverse()
export const deleteSticker = async (id: number) => done((await store('readwrite')).delete(id))
export const clearStickers = async () => done((await store('readwrite')).clear())
