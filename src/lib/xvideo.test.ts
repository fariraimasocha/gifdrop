// run: node --experimental-strip-types src/lib/xvideo.test.ts
import assert from 'node:assert/strict'
import { downloadName, isTwitterVideoUrl, parseTweetVideos } from './xvideo.ts'

assert.equal(isTwitterVideoUrl('https://video.twimg.com/amplify_video/1/vid/avc1/1280x720/a.mp4?tag=29'), true)
assert.equal(isTwitterVideoUrl('https://video.twimg.com/tweet_video/a.mp4'), true)
assert.equal(isTwitterVideoUrl('http://video.twimg.com/tweet_video/a.mp4'), false)
assert.equal(isTwitterVideoUrl('https://video.twimg.com.evil.com/a.mp4'), false)
assert.equal(isTwitterVideoUrl('https://evil.com/video.twimg.com/a.mp4'), false)
assert.equal(isTwitterVideoUrl('https://pbs.twimg.com/a.mp4'), false)
assert.equal(isTwitterVideoUrl('https://video.twimg.com/amplify_video/1/pl/a.m3u8'), false)
assert.equal(isTwitterVideoUrl('http://169.254.169.254/latest/a.mp4'), false)
assert.equal(isTwitterVideoUrl('not a url'), false)

const base = 'https://video.twimg.com/amplify_video/1'
const landscape = parseTweetVideos({
  media: {
    all: [
      { type: 'photo' },
      {
        type: 'video',
        thumbnail_url: 'https://pbs.twimg.com/amplify_video_thumb/1/img/t.jpg',
        duration: 100.7,
        width: 3840,
        height: 2160,
        formats: [
          { url: `${base}/pl/list.m3u8?tag=29`, container: 'm3u8' },
          { url: `${base}/vid/avc1/480x270/a.mp4?tag=29`, container: 'mp4' },
          { url: `${base}/vid/avc1/1920x1080/c.mp4?tag=29`, container: 'mp4' },
          { url: `${base}/vid/avc1/1280x720/b.mp4?tag=29`, container: 'mp4' },
          { url: 'https://evil.com/vid/avc1/3840x2160/x.mp4', container: 'mp4' },
        ],
      },
    ],
  },
})
assert.equal(landscape.length, 1, 'photos are skipped')
assert.equal(landscape[0].kind, 'video')
assert.equal(landscape[0].duration, 100.7)
assert.equal(landscape[0].thumbnail, 'https://pbs.twimg.com/amplify_video_thumb/1/img/t.jpg')
// best first, playlist and off-CDN files dropped
assert.deepEqual(
  landscape[0].variants.map((v) => [v.label, v.width, v.height]),
  [
    ['1080p', 1920, 1080],
    ['720p', 1280, 720],
    ['270p', 480, 270],
  ],
)
assert.equal(landscape[0].variants[0].url, `${base}/vid/avc1/1920x1080/c.mp4?tag=29`)
assert.equal(landscape[0].variants[0].size, null)

// portrait: named by the short side
const portrait = parseTweetVideos({
  media: {
    all: [
      {
        type: 'video',
        formats: [
          { url: `${base}/vid/avc1/320x568/a.mp4`, container: 'mp4' },
          { url: `${base}/vid/avc1/1080x1920/b.mp4`, container: 'mp4' },
        ],
      },
    ],
  },
})
assert.deepEqual(
  portrait[0].variants.map((v) => v.label),
  ['1080p', '320p'],
)

// GIFs are one MP4 with no size in the path: fall back to the post's dimensions
const gif = parseTweetVideos({
  media: {
    all: [
      {
        type: 'gif',
        thumbnail_url: 'https://evil.com/t.jpg',
        width: 432,
        height: 540,
        formats: [{ url: 'https://video.twimg.com/tweet_video/HXc2.mp4', container: 'mp4' }],
      },
    ],
  },
})
assert.equal(gif[0].kind, 'gif')
assert.equal(gif[0].duration, 0)
assert.equal(gif[0].thumbnail, null, 'thumbnails must come from pbs.twimg.com')
assert.deepEqual(gif[0].variants, [
  { url: 'https://video.twimg.com/tweet_video/HXc2.mp4', width: 432, height: 540, label: '432p', size: null },
])

// several videos in one post stay separate, in post order
const multi = parseTweetVideos({
  media: {
    all: [
      { type: 'video', formats: [{ url: `${base}/vid/avc1/640x360/a.mp4`, container: 'mp4' }] },
      { type: 'video', formats: [{ url: `${base}/vid/avc1/1280x720/b.mp4`, container: 'mp4' }] },
    ],
  },
})
assert.deepEqual(
  multi.map((v) => v.variants[0].label),
  ['360p', '720p'],
)

assert.deepEqual(parseTweetVideos({}), [])
assert.deepEqual(parseTweetVideos({ media: { all: [{ type: 'photo' }] } }), [])
assert.deepEqual(parseTweetVideos({ media: { all: [{ type: 'video', formats: [] }] } }), [], 'a video with no usable file is dropped')

assert.equal(downloadName('NASA-2123502343752986746-1080p'), 'NASA-2123502343752986746-1080p.mp4')
assert.equal(downloadName('a"; filename="evil.exe'), 'afilenameevilexe.mp4')
assert.equal(downloadName('../../etc/passwd'), 'etcpasswd.mp4')
assert.equal(downloadName('\r\nset-cookie: x=1'), 'set-cookiex1.mp4')
assert.equal(downloadName(undefined), 'x-video.mp4')
assert.equal(downloadName('💀💀'), 'x-video.mp4')
assert.equal(downloadName('a'.repeat(200)), `${'a'.repeat(80)}.mp4`)
console.log('xvideo ok')
