// Adapted from opensourceui.in "File Upload Field" (MIT, Bidyut Kundu).
import { useRef, useState } from 'react'
import { PixelarticonsImagePlus } from '#/components/icons/pixelarticons/image-plus'
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
        'group relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-[#d9d1c2] bg-background px-6 py-10 text-center outline-none transition-colors',
        'hover:border-foreground focus-visible:border-foreground',
        dragging && 'border-foreground bg-brand-soft',
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
      <span className={cn('grid size-14 -rotate-6 place-items-center rounded-2xl bg-brand shadow-[0_3px_0_var(--brand-deep)] transition', dragging && 'scale-110 rotate-0')}>
        <PixelarticonsImagePlus className="size-6" />
      </span>
      <p className="font-display text-xl font-extrabold tracking-[-0.02em]">{dragging ? 'Drop it' : 'Drop the drama here.'}</p>
      <p className="text-muted-foreground">
        <span className="pointer-coarse:hidden">Drag in a video or GIF, paste one, or click to choose.</span>
        <span className="hidden pointer-coarse:inline">Pick a video or GIF from your phone.</span>
      </p>
      <span className="mt-1 rounded-full border-2 border-foreground bg-card px-5 py-2.5 font-semibold">Choose video or GIF</span>
      <p className="text-sm text-dim">MP4 or GIF · up to 25 MB</p>
    </div>
  )
}
