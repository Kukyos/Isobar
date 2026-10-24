const STANCE = { for: 'For', against: 'Against', unsure: 'not sure yet' }

// Two separate scores: which side you support, and which side is arguing better.
export default function VotePanel({ m, v }) {
  const { vote, cast, error } = v
  const closed = m.status === 'closed'
  const btn = (field, value, cls, label) => (
    <button className={`btn ${cls}`} aria-pressed={vote?.[field] === value} disabled={closed}
      onClick={() => cast({ [field]: value })}>{label}</button>
  )
  return (
    <div className="vote-panel">
      <p className="vp-q">{closed ? 'Voting has closed.' : vote ? `You're ${vote.side === 'unsure' ? 'not sure yet' : `voting ${STANCE[vote.side]}`}` : 'Where do you stand?'}</p>
      <div className="vp-btns">
        {btn('side', 'for', 'btn-for', 'For')}
        {btn('side', 'against', 'btn-against', 'Against')}
        {btn('side', 'unsure', 'btn-quiet', 'Not sure')}
      </div>
      {vote && !closed && <>
        <p className="vp-q">Who's making more valid points?</p>
        <p className="vp-sub">This is scored separately from your side.</p>
        <div className="vp-btns">
          {btn('merit', 'for', 'btn-for', 'For')}
          {btn('merit', 'against', 'btn-against', 'Against')}
          {btn('merit', 'even', 'btn-quiet', 'Even')}
        </div>
      </>}
      {m.merit.count > 0 && (
        <p className="vp-merit">Valid points so far: For {m.merit.for}%, Against {m.merit.against}%, even {m.merit.even}%.</p>
      )}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  )
}
