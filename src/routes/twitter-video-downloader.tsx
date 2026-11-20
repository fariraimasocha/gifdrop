import { createFileRoute } from '@tanstack/react-router'
import { VideoDownloader } from '#/components/video-downloader'

const TITLE = 'Twitter (X) video downloader: save X videos as MP4, free | gifdrop'
const DESCRIPTION = 'Paste an X (Twitter) post link and download the video as an MP4 in any quality, up to 4K. Free, no sign-up, no watermark.'

export const Route = createFileRoute('/twitter-video-downloader')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
    ],
  }),
  component: VideoDownloader,
})
