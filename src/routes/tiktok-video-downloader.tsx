import { createFileRoute } from '@tanstack/react-router'
import { VideoDownloader } from '#/components/video-downloader'

const TITLE = 'TikTok video downloader: save TikToks without watermark, free | gifdrop'
const DESCRIPTION = 'Paste a TikTok link and download the video as an MP4 with no watermark. Works with share links from the app. Free, no sign-up.'

export const Route = createFileRoute('/tiktok-video-downloader')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
    ],
  }),
  component: () => <VideoDownloader platform="tiktok" />,
})
