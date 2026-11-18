// run: node --experimental-strip-types src/lib/media.test.ts
import assert from 'node:assert/strict'
import { classify, isAllowedMediaUrl } from './media.ts'

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
console.log('media ok')
