import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav, { Footer } from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import SideLabel from '../components/SideLabel.jsx'
import FrontBar from '../components/FrontBar.jsx'
import IsobarMap from '../components/IsobarMap.jsx'
import { motions, people, topics, verdict } from '../data.js'
import { useLiveShare } from '../lib/useLive.js'

export default function Feed() {
  const [topic, setTopic] = useState('All')
  const pick = (m) => topic === 'All' || m.topic === topic
  const live = motions.find((m) => m.status === 'live')
  const [share] = useLiveShare(live.share)
  const upcoming = motions.filter((m) => m.status === 'upcoming' && pick(m))
  const floor = motions.filter((m) => m.kind === 'floor' && pick(m))
  const closed = motions.filter((m) => m.status === 'closed' && pick(m))

  return (
    <>
      <Nav />
      <main className="wrap feed">
        <h1 className="page-title">Forecast</h1>
        <div className="chips" role="group" aria-label="Filter by topic">
          {topics.map((t) => <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>)}
        </div>

        {pick(live) && (
          <Link to={`/match/${live.id}`} className="live-tile">
            <Front share={share}>
              <div className="live-tile-in">
                <p className="live"><span className="pulse" aria-hidden="true" />Live, round 2 of 3</p>
                <h2 className="motion-title">{live.title}</h2>
                <div className="sides">
                  <SideLabel side="for" share={share} />
                  <SideLabel side="against" share={100 - share} />
                </div>
                <p className="hero-who">{people[live.for].name} and {people[live.against].name}, {live.judges.toLocaleString()} judging</p>
              </div>
            </Front>
          </Link>
        )}

        {upcoming.length > 0 && <>
          <h2 className="sec-title">Coming up</h2>
          <div className="upcoming">
            {upcoming.map((m) => <Storm key={m.id} m={m} />)}
          </div>
        </>}

        <h2 className="sec-title" id="floor">Open floor</h2>
        {floor.length ? (
          <ul className="readings">
            {floor.map((m) => (
              <li key={m.id}>
                <Link to={`/floor/${m.id}`}>
                  <span className="r-title">{m.title}<small>{m.topic}, {m.judges.toLocaleString()} judging</small></span>
                  <FrontBar share={m.share} />
                  <span className="r-num">{m.share}% for</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="empty">Nothing on the open floor in {topic} yet. <button className="link" onClick={() => setTopic('All')}>Show every topic</button></p>}

        {closed.length > 0 && <>
          <h2 className="sec-title">Recent verdicts</h2>
          <ul className="verdicts">
            {closed.map((m) => {
              const v = verdict(m)
              return (
                <li key={m.id}>
                  <Link to={`/verdict/${m.id}`}>
                    <span className="r-title">{m.title}<small>{m.when}</small></span>
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

export function Storm({ m }) {
  return (
    <Link to={`/match/${m.id}`} className="storm">
      <IsobarMap id={m.id} share={m.share} />
      <div className="storm-text">
        <span className="when">{m.when}</span>
        <h3>{m.title}</h3>
        <span className="vs">{people[m.for].name} and {people[m.against].name}</span>
      </div>
    </Link>
  )
}
