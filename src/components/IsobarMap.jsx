import { useMemo, useState } from 'react'
import { weatherMap } from '../lib/contours.js'

export default function IsobarMap({ id, share, className = '', w = 600, h = 360 }) {
  const m = useMemo(() => weatherMap(id, share, w, h), [id, share, w, h])
  return (
    <svg className={`isomap ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={w} height={h} fill="var(--warm-wash)" />
      <path d={m.coldFill} fill="var(--cold-wash)" />
      {m.lines.map((l, i) => (
        <path key={i} d={l.d} fill="none" stroke="var(--isoline)" strokeWidth={i % 4 === 3 ? 1.4 : 0.8} strokeLinecap="round" />
      ))}
      <path d={m.front} fill="none" stroke="var(--stratosphere)" strokeWidth="1.6" />
      <path d={m.tri} fill="var(--cold)" />
      <path d={m.semi} fill="var(--warm)" />
    </svg>
  )
}

// Photo slot that falls back to generated weather art until the image exists.
export function Sky({ src, id, share = 50, alt = '', className = '' }) {
  const [ok, setOk] = useState(true)
  return ok
    ? <img className={`sky ${className}`} src={src} alt={alt} onError={() => setOk(false)} />
    : <IsobarMap id={id} share={share} className={`sky ${className}`} />
}
