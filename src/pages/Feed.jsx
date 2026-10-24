import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav, { Footer, Failed, Loading } from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import SideLabel from '../components/SideLabel.jsx'
import FrontBar from '../components/FrontBar.jsx'
import IsobarMap from '../components/IsobarMap.jsx'
import { topics, verdict, when } from '../data.js'
import { listMotions, useLive, useQuery } from '../lib/db.js'
import { themeOf } from '../lib/theme.js'

export default function Feed() {
  const [topic, setTopic] = useState('All')
  const q = useQuery(listMotions, [])
  if (q.error) return <><Nav /><Failed error={q.error} retry={q.reload} /></>
  if (!q.data) return <><Nav /><Loading what="Loading the forecast" /></>

  const pick = (m) => topic === 'All' || m.topic === topic
  const all = q.data.filter(pick)
  const live = all.find((m) => m.status === 'live')
  const upcoming = all.filter((m) => m.status === 'upcoming')
  const floor = all.filter((m) => m.kind === 'floor' && m.status === 'open')
  const closed = all.filter((m) => m.kind === 'match' && m.status === 'closed')

  return (
    <>
      <Nav />
      <main className="wrap feed">
        <h1 className="page-title">Forecast</h1>
        <div className="chips" role="group" aria-label="Filter by topic">
          {topics.map((t) => <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>)}
        </div>

        {live && <LiveTile m={live} />}

        {upcoming.length > 0 && <>
          <h2 className="sec-title">Coming up</h2>
          <div className="upcoming">{upcoming.map((m) => <Storm key={m.id} m={m} />)}</div>
        </>}

        <h2 className="sec-title" id="floor">Open floor</h2>
        {floor.length ? (
          <ul className="readings">
            {floor.map((m) => (
              <li key={m.id} className={themeOf(m).className}>
                <Link to={`/floor/${m.slug}`}>
                  <span className="r-title">{m.title}<small>{m.topic}, {m.judges.toLocaleString()} judging</small></span>
                  <FrontBar share={m.share} />
                  <span className="r-num">{Math.round(m.share)}% for</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Nothing on the open floor in {topic} yet. <Link to="/new">Open the first motion</Link>.</p>
        )}

        {closed.length > 0 && <>
          <h2 className="sec-title">Recent verdicts</h2>
          <ul className="verdicts">
            {closed.map((m) => {
              const v = verdict(m)
              return (
                <li key={m.id} className={themeOf(m).className}>
                  <Link to={`/verdict/${m.slug}`}>
                    <span className="r-title">{m.title}<small>{when(m.starts_at)}</small></span>
                    <span className={`won won-${v.winner}`}>{v.winner === 'for' ? 'For' : 'Against'} won by {v.gain} points</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>}
      </main>
      <Footer />
    </>
  )
}

function LiveTile({ m: base }) {
  const m = useLive(base)
  return (
    <Link to={`/match/${m.slug}`} className="live-tile">
      <Front share={m.share} theme={themeOf(m)}>
        <div className="live-tile-in">
          <p className="live"><span className="pulse" aria-hidden="true" />Live now</p>
          <h2 className="motion-title">{m.title}</h2>
          <div className="sides">
            <SideLabel side="for" share={m.share} />
            <SideLabel side="against" share={100 - m.share} />
          </div>
          <p className="hero-who">{m.for_profile?.name} and {m.against_profile?.name}, {m.judges.toLocaleString()} judging</p>
        </div>
      </Front>
    </Link>
  )
}

export function Storm({ m }) {
  return (
    <Link to={`/match/${m.slug}`} className={`storm ${themeOf(m).className}`}>
      <IsobarMap id={m.slug} share={m.share} />
      <div className="storm-text">
        <span className="when">{when(m.starts_at)}</span>
        <h3>{m.title}</h3>
        <span className="vs">{m.for_profile?.name} and {m.against_profile?.name}</span>
      </div>
    </Link>
  )
}
