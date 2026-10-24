// Width follows the vote: the leading side stretches, the trailing side condenses.
export default function SideLabel({ side, share }) {
  const wd = Math.max(50, Math.min(150, 100 + (share - 50) * 2.5))
  return (
    <span className={`side side-${side}`} style={{ '--wd': wd }}>
      <span className="side-name">{side === 'for' ? 'For' : 'Against'}</span>
      <span className="side-num">{Math.round(share)}%</span>
    </span>
  )
}
