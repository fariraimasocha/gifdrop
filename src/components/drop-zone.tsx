// Adapted from opensourceui.in "File Upload Field" (MIT, Bidyut Kundu), recoloured for the dark theme.
import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '#/lib/utils'

export const ACCEPT = 'image/gif,video/mp4'

export function DropZone({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const pick = (list?: FileList | null) => list?.[0] && onFile(list[0])

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop a GIF or video, or press Enter to choose one"
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          input.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) pick(e.dataTransfer.files)
      }}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-lg bg-card outline-none transition-colors aspect-[5/3] sm:aspect-[21/9]',
        'shadow-[inset_0_0_0_1px_var(--border)] hover:bg-[#141416] focus-visible:shadow-[inset_0_0_0_1px_var(--brand)]',
        dragging && 'bg-[#121a15] shadow-[inset_0_0_0_1px_var(--brand)]',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
      <div aria-hidden className="absolute inset-0 grid grid-cols-6 grid-rows-3">
        {Array.from({ length: 18 }, (_, i) => (
          <div key={i} className="border-[0.5px] border-[#1a1a1d]" />
        ))}
      </div>
      {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map((c) => (
        <span
          key={c}
          aria-hidden
          className={cn('absolute size-4 border-[#3f3f46] transition-colors group-hover:border-brand', c, dragging && 'border-brand')}
        />
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span
          className={cn(
            'grid size-10 place-items-center rounded-md bg-muted text-muted-foreground shadow-[inset_0_0_0_1px_#2a2a2e] transition',
            'group-hover:text-foreground',
            dragging && 'scale-105 text-brand',
          )}
        >
          <ImagePlus className="size-4" />
        </span>
        <p className="text-[15px] text-foreground sm:text-sm">
          {dragging ? 'Drop it' : (
            <>
              <span className="pointer-coarse:hidden">Drop a GIF, paste one, or click to choose</span>
              <span className="hidden pointer-coarse:inline">Tap to choose a GIF or video</span>
            </>
          )}
        </p>
        <p className="font-mono text-[11px] text-dim">.gif · .mp4 up to 25 MB</p>
      </div>
    </div>
  )
}
