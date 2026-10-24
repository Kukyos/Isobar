import { useEffect, useState } from 'react'

// ponytail: fake live feed, a random walk; swap for a socket when there is a backend
export function useLiveShare(start) {
  const [share, setShare] = useState(start)
  useEffect(() => {
    // reduced motion: no ambient drift, only the user's own votes move the front
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setShare((s) => clamp(s + (Math.random() - 0.5) * 1.2)), 1800)
    return () => clearInterval(t)
  }, [])
  return [share, (d) => setShare((s) => clamp(s + d))]
}

export const clamp = (s) => Math.min(92, Math.max(8, s))
