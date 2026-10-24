import assert from 'node:assert'
import { weatherMap } from './contours.js'

const a = weatherMap('hot-dog', 50), b = weatherMap('hot-dog', 50), c = weatherMap('ai-art', 50)
assert.deepStrictEqual(a, b, 'same seed, same map')
assert.notStrictEqual(a.lines[3].d, c.lines[3].d, 'different seed, different map')
assert.ok(a.lines.every((l) => l.d.length > 0), 'every isobar level draws something')
const frontX = (m) => Number(m.front.match(/L([\d.-]+)/)[1])
assert.ok(frontX(weatherMap('x', 80)) - frontX(weatherMap('x', 20)) > 300, 'front moves with share')
assert.ok(a.tri && a.semi, 'front symbols drawn')
console.log('contours ok')
