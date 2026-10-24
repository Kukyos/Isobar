export const BRAND = 'Isobar'

export const topics = ['All', 'Politics', 'Tech', 'Food', 'Culture', 'Science', 'Sport']

export const shareOf = (v) => (v.for + v.against ? (v.for / (v.for + v.against)) * 100 : 50)

// Oxford-style: the side that gained the most points of the room wins
export function verdict(m) {
  const gFor = m.after.for - m.before.for, gAgainst = m.after.against - m.before.against
  const winner = gFor >= gAgainst ? 'for' : 'against'
  return { winner, gain: Math.max(gFor, gAgainst) }
}

export function when(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const midnight = (x) => new Date(x).setHours(0, 0, 0, 0)
  const day = Math.round((midnight(d) - midnight(Date.now())) / 864e5)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const label = day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : day === -1 ? 'Yesterday'
    : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
  return `${label}, ${time}`
}

export function slugify(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '')
  return `${base || 'motion'}-${Math.random().toString(36).slice(2, 6)}`
}
