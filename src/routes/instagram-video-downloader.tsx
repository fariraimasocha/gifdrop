import { createFileRoute } from '@tanstack/react-router'
import { VideoDownloader } from '#/components/video-downloader'

const TITLE = 'Instagram video downloader: save Reels as MP4, free | gifdrop'
const DESCRIPTION = 'Paste an Instagram Reel or video post link and download it as an MP4. Free, no sign-up, no watermark.'

export const Route = createFileRoute('/instagram-video-downloader')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
    ],
  }),
  component: () => <VideoDownloader platform="instagram" />,
})
