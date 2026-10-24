// Side palettes. Mono (black For / white Against) is the default;
// party debates use US colors, mapped through which side is left-wing.
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

const BLUE = { base: '#2d5fe0', alt: '#1e46b8' }
const RED = { base: '#d7263d', alt: '#b01c30' }

const MONO = {
  className: 'th-mono',
  gl: { a: [rgb('#0c0e11'), rgb('#2a2f36')], b: [rgb('#ffffff'), rgb('#d9dfe5')], line: rgb('#7e8b98'), lineAmt: 0.35, seam: rgb('#7e8b98') },
}
const party = (forC, againstC, className) => ({
  className,
  gl: { a: [rgb(forC.base), rgb(forC.alt)], b: [rgb(againstC.base), rgb(againstC.alt)], line: rgb('#ffffff'), lineAmt: 0.12, seam: rgb('#ffffff') },
})
const LEFT_FOR = party(BLUE, RED, 'th-party-l')
const RIGHT_FOR = party(RED, BLUE, 'th-party-r')

export function themeOf(m) {
  if (m?.palette !== 'party') return MONO
  return m.for_wing === 'right' ? RIGHT_FOR : LEFT_FOR
}
