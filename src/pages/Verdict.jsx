import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Nav, { Failed, Loading } from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import FrontBar from '../components/FrontBar.jsx'
import { Sky } from '../components/IsobarMap.jsx'
import { shareOf, verdict, when } from '../data.js'
import { motionBySlug, useQuery } from '../lib/db.js'
import { themeOf } from '../lib/theme.js'
import NotFound from './NotFound.jsx'

const NAME = { for: 'For', against: 'Against' }

export default function Verdict() {
  const { id } = useParams()
  const q = useQuery(() => motionBySlug(id), [id])
  if (q.error) return <><Nav /><Failed error={q.error} retry={q.reload} /></>
  if (q.loading && !q.data) return <><Nav /><Loading /></>
  if (!q.data) return <NotFound />
  if (q.data.status !== 'closed') return (
    <><Nav /><main className="wrap gate">
      <h1 className="display-sm">No verdict yet.</h1>
      <p className="lede">This debate is still open. <Link to={`/${q.data.kind === 'match' ? 'match' : 'floor'}/${q.data.slug}`}>Go vote</Link>.</p>
    </main></>
  )
  return <VerdictView key={q.data.id} m={q.data} />
}

function VerdictView({ m }) {
  const v = verdict(m)
  const before = shareOf(m.before), after = shareOf(m.after)
  const [shown, setShown] = useState(before)
  const [copied, setCopied] = useState('')
  const th = themeOf(m)
  const winnerName = m[`${v.winner}_profile`]?.name
  // the one orchestrated moment: the front slides from the opening vote to the closing vote
  const replay = () => { setShown(before); setTimeout(() => setShown(after), 700) }
  useEffect(replay, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied('Link copied.') }
    catch { setCopied('Copy failed. Copy the address from your browser bar instead.') }
  }

  const row = (label, s, was) => (
    <div className="vrow">
      <span className="vrow-label">{label}</span>
      <FrontBar share={shareOf(s)} was={was} />
      <span className="vrow-nums">{s.for}% for, {s.against}% against, {s.undecided}% not sure</span>
    </div>
  )

  return (
    <div className={th.className}>
      <Front share={shown} theme={th} className="verdict-band">
        <Nav onDark />
        <div className="band-in wrap">
          <p className="live">Verdict, {when(m.starts_at).toLowerCase()}, {m.judges.toLocaleString()} judges</p>
          <h1 className="motion-title">{m.title}</h1>
          <p className={`winner winner-${v.winner}`}>{NAME[v.winner]} wins.</p>
          <button className="btn btn-ghost" onClick={replay}>Replay the swing</button>
        </div>
      </Front>

      <main className="wrap verdict">
        <section className="swing">
          <h2 className="display-sm">{NAME[v.winner]} gained {v.gain} points of the room.</h2>
          <p className="lede">
            {winnerName ?? NAME[v.winner]} argued {NAME[v.winner]}
            {v.winner !== (before >= 50 ? 'for' : 'against') ? ' and started behind.' : ' and held the lead.'}
            {' '}The marker shows where the front stood before the first round.
          </p>
          {row('Before', m.before)}
          {row('After', m.after, before)}
          {m.merit.count > 0 && (
            <p className="vp-merit">On valid points the room scored For {m.merit.for}%, Against {m.merit.against}%, even {m.merit.even}%.</p>
          )}
        </section>

        <section className="share-card">
          <figure>
            <Sky src="/img/verdict-sky.jpg" id={`${m.slug}-verdict`} share={after} />
            <figcaption>
              <span>{m.title}</span>
              <strong>{NAME[v.winner]} wins by {v.gain} points</strong>
            </figcaption>
          </figure>
          <div className="share-actions">
            <button className="btn btn-ink" onClick={copy}>Copy link</button>
            <Link to="/feed">Back to the forecast</Link>
            <p className="ok" aria-live="polite">{copied}</p>
          </div>
        </section>
      </main>
    </div>
  )
}
