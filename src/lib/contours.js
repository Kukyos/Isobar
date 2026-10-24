// Generative weather-map art: seeded pressure field -> isobars (marching squares)
// plus a stationary front placed at the vote share.

export function seedOf(str) {
  let h = 2166136261
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function valueNoise(rand) {
  const N = 16, g = Array.from({ length: N * N }, rand)
  const at = (i, j) => g[((j % N + N) % N) * N + ((i % N + N) % N)]
  const s = (t) => t * t * (3 - 2 * t)
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = s(x - i), fy = s(y - j)
    const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
}

// segment table: edges t r b l, corner bits tl=8 tr=4 br=2 bl=1
const CASES = [[], ['l', 'b'], ['b', 'r'], ['l', 'r'], ['t', 'r'], ['t', 'l', 'b', 'r'], ['t', 'b'], ['t', 'l'],
  ['t', 'l'], ['t', 'b'], ['t', 'r', 'l', 'b'], ['t', 'r'], ['l', 'r'], ['b', 'r'], ['l', 'b'], []]

const f1 = (n) => Math.round(n * 10) / 10

export function weatherMap(id, share, w = 600, h = 360, levels = 11) {
  const rand = rng(seedOf(id))
  const noise = valueNoise(rand)
  const fbm = (x, y) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.1
  const lo = { x: w * (0.12 + rand() * 0.18), y: h * (0.25 + rand() * 0.5) }
  const hi = { x: w * (0.70 + rand() * 0.18), y: h * (0.25 + rand() * 0.5) }
  const r = Math.min(w, h) * 0.42
  const g = (p, x, y) => Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (r * r))
  const field = (x, y) => g(hi, x, y) - g(lo, x, y) + 0.5 * fbm(x / w * 3, y / h * 3)

  const cell = 10, nx = Math.ceil(w / cell) + 1, ny = Math.ceil(h / cell) + 1
  const v = []
  let min = Infinity, max = -Infinity
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const val = field(i * cell, j * cell)
    v.push(val); min = Math.min(min, val); max = Math.max(max, val)
  }
  const V = (i, j) => v[j * nx + i]

  const lines = []
  for (let k = 1; k <= levels; k++) {
    const lvl = min + ((max - min) * k) / (levels + 1)
    let d = ''
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const tl = V(i, j), tr = V(i + 1, j), br = V(i + 1, j + 1), bl = V(i, j + 1)
      const idx = (tl > lvl) * 8 + (tr > lvl) * 4 + (br > lvl) * 2 + (bl > lvl)
      const segs = CASES[idx]
      if (!segs.length) continue
      const x0 = i * cell, y0 = j * cell, t = (a, b) => (lvl - a) / (b - a) * cell
      const pt = {
        t: () => [x0 + t(tl, tr), y0], b: () => [x0 + t(bl, br), y0 + cell],
        l: () => [x0, y0 + t(tl, bl)], r: () => [x0 + cell, y0 + t(tr, br)],
      }
      for (let s = 0; s < segs.length; s += 2) {
        const [ax, ay] = pt[segs[s]](), [bx, by] = pt[segs[s + 1]]()
        d += `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`
      }
    }
    lines.push({ d, level: k / (levels + 1) })
  }

  // the front: a wobbly line at x = share
  const phase = rand() * 6.28, amp = w * 0.05, fx = (share / 100) * w
  const pts = []
  for (let y = -10; y <= h + 10; y += 6) {
    const wob = Math.sin((y / h) * 6.28 * 1.2 + phase) * 0.6 + (fbm(3.7, y / h * 2.5) - 0.5) * 1.4
    pts.push([fx + wob * amp, y])
  }
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join('')
  const coldFill = `M-10 -10${line.replace(/^M/, 'L')}L-10 ${h + 10}Z`

  // stationary-front symbols: blue triangles push into Against, orange half-discs push into For
  const s = Math.min(w, h) * 0.022, gap = s * 4.2
  const tri = [], semi = []
  let acc = 0, flip = false
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
    const len = Math.hypot(bx - ax, by - ay)
    acc += len
    if (acc < gap || by < s || by > h - s) continue
    acc = 0
    const tx = (bx - ax) / len, ty = (by - ay) / len, nx = ty, ny = -tx // normal points to +x
    const p = (u, n) => `${f1(bx + tx * u + nx * n)} ${f1(by + ty * u + ny * n)}`
    if ((flip = !flip)) tri.push(`M${p(-s, 0)}L${p(0, s * 1.5)}L${p(s, 0)}Z`)
    else {
      let d = `M${p(-s, 0)}`
      for (let a = 1; a <= 8; a++) d += `L${p(-Math.cos((a / 8) * Math.PI) * s, -Math.sin((a / 8) * Math.PI) * s)}`
      semi.push(d + 'Z')
    }
  }

  return { w, h, lines, front: line, coldFill, tri: tri.join(''), semi: semi.join(''), lo, hi }
}
