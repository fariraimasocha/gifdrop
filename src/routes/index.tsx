import { createFileRoute } from '@tanstack/react-router'
import { Converter } from '#/components/converter'

export const Route = createFileRoute('/')({
  component: () => (
    <Converter
      eyebrow="lol. no way"
      headline="Turn any GIF or clip"
      blurb="Paste a link or pick a clip. Keep the best bit. Paste it in WhatsApp as a sticker. Your group chat has heard “lol” enough."
      placeholder="Paste an X, TikTok or GIF link"
    />
  ),
})
