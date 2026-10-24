import { Link, useParams } from 'react-router-dom'
import Nav, { Failed, Loading } from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import SideLabel from '../components/SideLabel.jsx'
import VotePanel from '../components/VotePanel.jsx'
import { when } from '../data.js'
import { motionBySlug, useLive, useQuery, useVote } from '../lib/db.js'
import { themeOf } from '../lib/theme.js'
import NotFound from './NotFound.jsx'

const ROUNDS = ['Opening', 'Rebuttal', 'Closing']

export default function Match() {
  const { id } = useParams()
  const q = useQuery(() => motionBySlug(id), [id])
  if (q.error) return <><Nav /><Failed error={q.error} retry={q.reload} /></>
  if (q.loading && !q.data) return <><Nav /><Loading /></>
  if (!q.data || q.data.kind !== 'match') return <NotFound />
  return <MatchView key={q.data.id} base={q.data} />
}

function MatchView({ base }) {
  const m = useLive(base)
  const v = useVote(m.id)
  const th = themeOf(m)
  const live = m.status === 'live'

  return (
    <div className={th.className}>
      <Front share={m.share} theme={th} className="match-band">
        <Nav onDark />
        <div className="band-in wrap">
          <p className="live">
            {live ? <><span className="pulse" aria-hidden="true" />Live, {m.judges.toLocaleString()} judging</> : `${when(m.starts_at)}, ${m.judges.toLocaleString()} judging`}
          </p>
          <h1 className="motion-title">{m.title}</h1>
          <div className="sides">
            <SideLabel side="for" share={m.share} />
            <SideLabel side="against" share={100 - m.share} />
          </div>
        </div>
      </Front>

      <main className="wrap match">
        <div className="match-main">
          <ol className="rounds" aria-label="Rounds">
            {ROUNDS.map((r, i) => <li key={r}><span className="r-i">{i + 1}</span>{r}</li>)}
          </ol>
          <section className="speaker">
            <div>
              <p className="speaker-name">
                {m.status === 'closed' ? 'This match has closed.' : live ? 'This match is live.' : `Starts ${when(m.starts_at).toLowerCase()}`}
              </p>
              <p className="speaker-meta">
                {m.for_profile && <Link to={`/u/${m.for_profile.handle}`}>{m.for_profile.name}</Link>} argues For and{' '}
                {m.against_profile && <Link to={`/u/${m.against_profile.handle}`}>{m.against_profile.name}</Link>} argues Against.
              </p>
            </div>
          </section>
          {m.status === 'closed'
            ? <p className="empty"><Link to={`/verdict/${m.slug}`}>See the verdict</Link></p>
            : <p className="empty">The transcript appears here once the speakers start.</p>}
        </div>

        <aside className="crowd">
          <VotePanel m={m} v={v} />
        </aside>
      </main>
    </div>
  )
}
