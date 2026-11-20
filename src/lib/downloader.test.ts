// run: node --experimental-strip-types src/lib/downloader.test.ts
import assert from 'node:assert/strict'
import { downloadName, parseTikTokPage, parseTweetVideos, rangeTotal } from './downloader.ts'

// ---------- X ----------
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
          { url: 'http://video.twimg.com/vid/avc1/3840x2160/x.mp4', container: 'mp4' },
        ],
      },
    ],
  },
})
assert.equal(landscape.length, 1, 'photos are skipped')
assert.equal(landscape[0].kind, 'video')
assert.equal(landscape[0].duration, 100.7)
assert.equal(landscape[0].thumbnail, 'https://pbs.twimg.com/amplify_video_thumb/1/img/t.jpg')
// best first; the playlist, the off-CDN file and the plain-http file are dropped
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
assert.equal(gif[0].thumbnail, null, 'thumbnails must come from an allowlisted host')
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

// ---------- TikTok ----------
const tiktokPage = (scope: unknown) =>
  `<html><head><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify({ __DEFAULT_SCOPE__: scope })}</script></head></html>`

const item = {
  id: '7691135960544808222',
  desc: 'a caption with <b>markup</b> & "quotes"',
  author: { uniqueId: 'drama.edits272', nickname: 'Drama Edits' },
  video: { duration: 22, width: 576, height: 1024, cover: 'https://p19-common-sign.tiktokcdn-eu.com/c.jpeg' },
}
assert.deepEqual(parseTikTokPage(tiktokPage({ 'webapp.video-detail': { statusCode: 0, itemInfo: { itemStruct: item } } })), item)
// TikTok says the post is gone or private
assert.equal(parseTikTokPage(tiktokPage({ 'webapp.video-detail': { statusCode: 10204, statusMsg: 'item doesn\'t exist' } })), 'missing')
// some other page (the home page a dead share link lands on), or a page we can't read: no verdict
assert.equal(parseTikTokPage(tiktokPage({ 'webapp.app-context': {} })), null)
assert.equal(parseTikTokPage(tiktokPage({ 'webapp.video-detail': {} })), null)
assert.equal(parseTikTokPage('<html><body>Please verify you are human</body></html>'), null)
assert.equal(parseTikTokPage('<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{not json</script>'), null)
assert.equal(parseTikTokPage(''), null)
// photo slideshows are recognisable so the caller can say "no video"
const photo = parseTikTokPage(tiktokPage({ 'webapp.video-detail': { statusCode: 0, itemInfo: { itemStruct: { id: '1234567', imagePost: { images: [] } } } } }))
assert.ok(photo && photo !== 'missing' && photo.imagePost)

// ---------- download filename ----------
assert.equal(downloadName('NASA-2123502343752986746-1080p'), 'NASA-2123502343752986746-1080p.mp4')
assert.equal(downloadName('drama.edits272-7691135960544808222-576p'), 'drama.edits272-7691135960544808222-576p.mp4', 'handles keep their dots')
assert.equal(downloadName('a"; filename="evil.exe'), 'afilenameevil.exe.mp4')
assert.equal(downloadName('../../etc/passwd'), 'etcpasswd.mp4')
assert.equal(downloadName('..'), 'video.mp4')
assert.equal(downloadName('.hidden'), 'hidden.mp4')
assert.equal(downloadName('\r\nset-cookie: x=1'), 'set-cookiex1.mp4')
assert.equal(downloadName(undefined), 'video.mp4')
assert.equal(downloadName(''), 'video.mp4')
assert.equal(downloadName('💀💀'), 'video.mp4')
assert.equal(downloadName('a'.repeat(200)), `${'a'.repeat(80)}.mp4`)
// nothing that could end the header value or start a new header ever survives
for (const hostile of ['a"b', 'a\\b', 'a\nb', 'a\rb', 'a;b', 'a/b', 'a b']) assert.match(downloadName(hostile), /^[\w.-]+\.mp4$/)
// file size from a ranged answer
assert.equal(rangeTotal('bytes 0-0/265069'), 265069)
assert.equal(rangeTotal('bytes 0-0/*'), null, 'unknown total')
assert.equal(rangeTotal(null), null)
assert.equal(rangeTotal(''), null)

console.log('downloader ok')
