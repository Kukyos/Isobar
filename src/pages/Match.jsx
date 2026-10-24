import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import SideLabel from '../components/SideLabel.jsx'
import { byId, people } from '../data.js'
import { useLiveShare } from '../lib/useLive.js'
import NotFound from './NotFound.jsx'

const ROUNDS = ['Opening', 'Rebuttal', 'Closing']
const STANCE = { for: 'For', against: 'Against', unsure: 'Not sure' }
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const pull = { for: 3, against: -3, unsure: 0 }

export default function Match() {
  const m = byId(useParams().id)
  if (!m || m.kind !== 'match') return <NotFound />
  return <MatchView key={m.id} m={m} />
}

function MatchView({ m }) {
  const [share, nudge] = useLiveShare(m.share)
  const [stance, setStance] = useState(null)
  const [clock, setClock] = useState(m.clock ?? 180)
  const live = m.status === 'live'
  const round = m.round ?? 0
  const speaker = (m.transcript?.length ?? 0) % 2 ? m.against : m.for
  const speakerSide = speaker === m.for ? 'for' : 'against'

  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setClock((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [live])

  const move = (side) => {
    if (side === stance) return
    nudge(pull[side] - (stance ? pull[stance] : 0))
    setStance(side)
  }

  return (
    <>
      <Front share={share} className="match-band">
        <Nav onDark />
        <div className="band-in wrap">
          <p className="live">{live ? <><span className="pulse" aria-hidden="true" />Live, {m.judges.toLocaleString()} judging</> : m.when}</p>
          <h1 className="motion-title">{m.title}</h1>
          <div className="sides">
            <SideLabel side="for" share={share} />
            <SideLabel side="against" share={100 - share} />
          </div>
        </div>
      </Front>

      {!stance ? (
        <main className="wrap gate">
          <h2 className="display-sm">Where do you stand before it starts?</h2>
          <p className="lede">Your first vote is the baseline. The winner is whoever moves people like you.</p>
          <div className="gate-btns">
            <button className="btn btn-for" onClick={() => move('for')}>For</button>
            <button className="btn btn-against" onClick={() => move('against')}>Against</button>
            <button className="btn btn-quiet" onClick={() => move('unsure')}>Not sure yet</button>
          </div>
        </main>
      ) : (
        <main className="wrap match">
          <div className="match-main">
            <ol className="rounds" aria-label="Rounds">
              {ROUNDS.map((r, i) => (
                <li key={r} className={i < round ? 'done' : i === round ? 'now' : ''} aria-current={i === round ? 'step' : undefined}>
                  <span className="r-i">{i + 1}</span>{r}
                </li>
              ))}
            </ol>

            {live ? (
              <section className={`speaker speaker-${speakerSide}`}>
                <span className="avatar" aria-hidden="true">{people[speaker].name[0]}</span>
                <div>
                  <p className="speaker-name">{people[speaker].name} is speaking</p>
                  <p className="speaker-meta">{ROUNDS[round]} for {STANCE[speakerSide]}</p>
                </div>
                <span className="clock" role="timer" aria-label={`${mmss(clock)} left`}>{mmss(clock)}</span>
              </section>
            ) : (
              <section className="speaker">
                <div>
                  <p className="speaker-name">Starts {m.when.toLowerCase()}</p>
                  <p className="speaker-meta">{people[m.for].name} argues For and {people[m.against].name} argues Against. Your first vote is saved.</p>
                </div>
              </section>
            )}

            {m.transcript && (
              <ol className="transcript">
                {m.transcript.map((t, i) => (
                  <li key={i} className={`turn turn-${t.who === m.for ? 'for' : 'against'}`}>
                    <p className="turn-who"><Link to={`/u/${t.who}`}>{people[t.who].name}</Link>, {ROUNDS[t.round].toLowerCase()}</p>
                    <p>{t.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="crowd">
            <p className="crowd-you">{stance === 'unsure' ? "You're not sure yet" : `You're voting ${STANCE[stance]}`}</p>
            <div className="crowd-btns">
              <button className="btn btn-for" aria-pressed={stance === 'for'} onClick={() => move('for')}>For</button>
              <button className="btn btn-against" aria-pressed={stance === 'against'} onClick={() => move('against')}>Against</button>
            </div>
            {m.swings && <>
              <h2 className="crowd-h">How the room moved</h2>
              <ul className="swings">{m.swings.map((s) => <li key={s}>{s}</li>)}</ul>
            </>}
            <Link className="demo-link" to={`/verdict/${m.id}`}>Skip to the verdict (demo)</Link>
          </aside>
        </main>
      )}
    </>
  )
}
