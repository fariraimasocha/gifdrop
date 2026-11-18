import { createFileRoute } from '@tanstack/react-router'
import { Converter } from '#/components/converter'

const TITLE = 'TikTok to WhatsApp GIF & sticker | gifdrop'
const DESCRIPTION = 'Paste a TikTok link, get a looping GIF for WhatsApp, then turn it into an animated sticker. Free, no app needed.'

export const Route = createFileRoute('/tiktok')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
    ],
  }),
  component: () => (
    <Converter
      eyebrow="wait for it…"
      headline="Turn any TikTok"
      blurb="Paste a TikTok link, keep the best 4 seconds, then paste it in WhatsApp as an animated sticker."
      placeholder="Paste a TikTok link"
    />
  ),
})
