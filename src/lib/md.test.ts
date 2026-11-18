// run: node --experimental-strip-types src/lib/md.test.ts
import assert from 'node:assert/strict'
import { md } from './md.ts'

assert.equal(md('## Hi **there**'), '<h2>Hi <strong>there</strong></h2>')
assert.equal(md('- a\n- b'), '<ul><li>a</li><li>b</li></ul>')
assert.equal(md('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>')
assert.equal(md('one\ntwo\n\nthree'), '<p>one two</p>\n<p>three</p>')
assert.equal(md('[home](/)'), '<p><a href="/">home</a></p>')
assert.equal(md('[x](https://a.b)'), '<p><a href="https://a.b" rel="noopener" target="_blank">x</a></p>')
// escaped, and javascript: links never become anchors
assert.equal(md('<script>[x](javascript:alert(1))'), '<p>&lt;script&gt;[x](javascript:alert(1))</p>')
console.log('md ok')
