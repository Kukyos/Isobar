import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import IsobarMap from '../components/IsobarMap.jsx'
import SideLabel from '../components/SideLabel.jsx'
import { byId, people } from '../data.js'
import { themeOf } from '../lib/theme.js'
import NotFound from './NotFound.jsx'

const NAME = { for: 'For', against: 'Against' }

export default function Floor() {
  const m = byId(useParams().id)
  if (!m || m.kind !== 'floor') return <NotFound />
  return <FloorView key={m.id} m={m} />
}

function FloorView({ m }) {
  const [args, setArgs] = useState(m.args)
  const [backed, setBacked] = useState({})
  const [tab, setTab] = useState('for')
  const [side, setSide] = useState('for')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [posted, setPosted] = useState('')

  const back = (id) => setBacked((b) => ({ ...b, [id]: !b[id] }))
  const post = (e) => {
    e.preventDefault()
    if (text.trim().length < 20) return setError('Write at least 20 characters so people know what you mean.')
    setArgs((a) => [{ id: Date.now(), side, who: 'you', score: 0, text: text.trim() }, ...a])
    setText(''); setError(''); setTab(side)
    setPosted(`Argument posted to ${NAME[side]}.`)
  }

  const column = (s) => {
    const list = args.filter((a) => a.side === s).sort((a, b) => b.score - a.score)
    return (
      <section className={`col col-${s}`} data-active={tab === s} aria-labelledby={`h-${s}`}>
        <h2 id={`h-${s}`} className="col-h">{NAME[s]}<span>{list.length} arguments</span></h2>
        {list.length ? (
          <ol className="args">
            {list.map((a) => (
              <li key={a.id} className="arg">
                <p>{a.text}</p>
                <div className="arg-foot">
                  <Link to={`/u/${a.who}`}>{people[a.who].name}</Link>
                  <button className="strong" aria-pressed={!!backed[a.id]} onClick={() => back(a.id)}>
                    Strong point {a.score + (backed[a.id] ? 1 : 0)}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="empty">No arguments for {NAME[s]} yet. Yours would be the first one people read.</p>}
      </section>
    )
  }

  return (
    <div className={themeOf(m).className}>
      <Nav />
      <header className="floor-head">
        <IsobarMap id={m.id} share={m.share} w={1200} h={420} />
        <div className="wrap floor-head-in">
          <p className="live">Open floor, {m.topic}, {m.judges.toLocaleString()} judging</p>
          <h1 className="motion-title">{m.title}</h1>
          <div className="sides">
            <SideLabel side="for" share={m.share} />
            <SideLabel side="against" share={100 - m.share} />
          </div>
        </div>
      </header>

      <main className="wrap floor">
        <form className="compose" onSubmit={post}>
          <label htmlFor="arg">Add your argument</label>
          <textarea id="arg" rows="3" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Make one point, and back it up." aria-describedby="arg-err" />
          <div className="compose-foot">
            <fieldset className="pick">
              <legend>Side</legend>
              {['for', 'against'].map((s) => (
                <label key={s} className={`pick-${s}`}>
                  <input type="radio" name="side" value={s} checked={side === s} onChange={() => setSide(s)} />{NAME[s]}
                </label>
              ))}
            </fieldset>
            <button className="btn btn-ink" type="submit">Post argument</button>
          </div>
          <p id="arg-err" className="err" aria-live="polite">{error}</p>
          <p className="ok" aria-live="polite">{posted}</p>
        </form>

        <div className="tabs" role="tablist" aria-label="Sides">
          {['for', 'against'].map((s) => (
            <button key={s} role="tab" aria-selected={tab === s} className={`tab tab-${s}`} onClick={() => setTab(s)}>{NAME[s]}</button>
          ))}
        </div>
        <div className="cols">{column('for')}{column('against')}</div>
      </main>
    </div>
  )
}
