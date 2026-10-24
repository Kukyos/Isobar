// Thin vote bar with a wavy front; `was` marks an earlier share.
export default function FrontBar({ share, was, className = '' }) {
  let d = `M0 0H${share}`
  for (let y = 0; y <= 12; y += 2) d += `L${(share + Math.sin(y * 0.9) * 1.1).toFixed(2)} ${y}`
  d += 'H0Z'
  return (
    <svg className={`frontbar ${className}`} viewBox="0 0 100 12" preserveAspectRatio="none"
      role="img" aria-label={`${Math.round(share)}% For, ${100 - Math.round(share)}% Against`}>
      <rect width="100" height="12" fill="var(--b)" />
      <path d={d} fill="var(--a)" />
      {was != null && <rect x={was - 0.25} width="0.5" height="12" fill="var(--was)" />}
    </svg>
  )
}
