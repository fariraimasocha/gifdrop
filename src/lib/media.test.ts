// run: node --experimental-strip-types src/lib/media.test.ts
import assert from 'node:assert/strict'
import { classify, isAllowedMediaUrl, parseInstagramPage, tiktokId } from './media.ts'

assert.deepEqual(classify('https://x.com/user/status/1234567890?s=20'), { kind: 'tweet', id: '1234567890' })
assert.deepEqual(classify('https://twitter.com/u/status/42'), { kind: 'tweet', id: '42' })
assert.deepEqual(classify('https://x.com/user'), { kind: 'invalid' })
assert.deepEqual(classify('https://giphy.com/gifs/cat-dance-abc123XYZ'), {
  kind: 'direct',
  url: 'https://i.giphy.com/media/abc123XYZ/giphy.gif',
})
assert.equal(classify('https://media.tenor.com/x/y.gif').kind, 'direct')
assert.equal(classify('https://evil.com/a.gif').kind, 'invalid')
assert.equal(classify('http://169.254.169.254/latest').kind, 'invalid')
assert.equal(classify('javascript:alert(1)').kind, 'invalid')
assert.equal(isAllowedMediaUrl('https://video.twimg.com.evil.com/a.mp4'), false)
assert.equal(isAllowedMediaUrl('http://video.twimg.com/a.mp4'), false)
assert.equal(isAllowedMediaUrl('https://video.twimg.com/tweet_video/a.mp4'), true)
assert.deepEqual(classify('https://www.tiktok.com/@a/video/123?lang=en'), { kind: 'tiktok', url: 'https://www.tiktok.com/@a/video/123' })
assert.equal(classify('https://vm.tiktok.com/ZMabc/').kind, 'tiktok')
assert.equal(classify('https://tiktok.com.evil.com/x').kind, 'invalid')
assert.deepEqual(classify('https://www.instagram.com/reel/C8sQZ3iN2Tq/?igsh=x'), { kind: 'instagram', id: 'C8sQZ3iN2Tq' })
assert.equal(classify('https://instagram.com/someuser').kind, 'invalid')
assert.equal(isAllowedMediaUrl('https://v16m.tiktokcdn-us.com/a/video/'), true)
assert.equal(isAllowedMediaUrl('https://scontent-jnb1-1.cdninstagram.com/v.mp4'), true)
assert.equal(isAllowedMediaUrl('https://eviltiktokcdn.com/a'), false)

// TikTok: the post id from every address that carries one; share links carry none and must be followed
assert.equal(tiktokId('https://www.tiktok.com/@a.b_c/video/7691135960544808222'), '7691135960544808222')
assert.equal(tiktokId('https://www.tiktok.com/@/video/7691135960544808222?_r=1'), '7691135960544808222')
assert.equal(tiktokId('https://m.tiktok.com/v/7691135960544808222.html'), '7691135960544808222')
assert.equal(tiktokId('https://vm.tiktok.com/ZMabcdefg/'), null)
assert.equal(tiktokId('https://www.tiktok.com/t/ZTabcdefg/'), null)
assert.equal(tiktokId('https://www.tiktok.com/@a/photo/7691135960544808222'), null, 'photo posts have no video')
assert.equal(tiktokId('https://www.tiktok.com/?_r=1'), null)
assert.equal(tiktokId('https://www.tiktok.com/@a/video/12'), null)

// Instagram mirror page: the file, who posted it, and the caption with entities decoded
const reel = parseInstagramPage(
  '<meta name="twitter:title" content="@nasa.jpl"/><meta property="og:description" content="NASA&#39;s view &amp; more\n\n&quot;wow&quot; &lt;3"/>' +
    '<meta property="og:video" content="/videos/DcBx_I1iHZW/1?audio=1&amp;x=2"/><meta property="og:video:secure_url" content="/videos/DcBx_I1iHZW/1?audio=1"/>',
)
assert.deepEqual(reel, { video: '/videos/DcBx_I1iHZW/1?audio=1&x=2', handle: 'nasa.jpl', caption: 'NASA\'s view & more\n\n"wow" <3' })
// a photo post exists (it has a handle) but has no video
assert.deepEqual(parseInstagramPage('<meta name="twitter:title" content="@nasa"/><meta property="og:image" content="/images/x/1"/>'), { video: null, handle: 'nasa', caption: '' })
// the mirror's "not found" page has its own title, not a handle
assert.deepEqual(parseInstagramPage('<meta name="twitter:title" content="fix instagram embeds"/>'), { video: null, handle: '', caption: '' })
assert.deepEqual(parseInstagramPage(''), { video: null, handle: '', caption: '' })
console.log('media ok')
