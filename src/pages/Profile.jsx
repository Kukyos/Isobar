import { Link, useParams } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import IsobarMap from '../components/IsobarMap.jsx'
import FrontBar from '../components/FrontBar.jsx'
import { motions, people } from '../data.js'
import { seedOf } from '../lib/contours.js'
import { themeOf } from '../lib/theme.js'
import NotFound from './NotFound.jsx'

export default function Profile() {
  const p = people[useParams().handle]
  if (!p) return <NotFound />
  const debates = motions.filter((m) => m.for === p.handle || m.against === p.handle)
  // ponytail: fake stance history derived from the handle
  let s = seedOf(p.handle)
  const climate = Array.from({ length: 48 }, () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 16) % 100 < 55 ? 'for' : 'against')

  return (
    <>
      <Nav />
      <header className="profile-head">
        <IsobarMap id={`user-${p.handle}`} share={(p.wins / (p.wins + p.losses)) * 100} w={1200} h={360} />
        <div className="wrap profile-in">
          <span className="avatar avatar-lg" aria-hidden="true">{p.name[0]}</span>
          <div>
            <h1 className="page-title">{p.name}</h1>
            <p className="lede">{p.bio}</p>
          </div>
        </div>
      </header>
      <main className="wrap profile">
        <dl className="record">
          <div><dt>Wins</dt><dd>{p.wins}</dd></div>
          <div><dt>Losses</dt><dd>{p.losses}</dd></div>
          <div><dt>Minds changed</dt><dd>{p.minds.toLocaleString()}</dd></div>
        </dl>

        <section>
          <h2 className="sec-title">Climate</h2>
          <p className="sec-sub">How {p.handle === 'you' ? 'you' : p.name.split(' ')[0]} voted in the last 48 debates. Blue is For, orange is Against.</p>
          <div className="climate" role="img" aria-label={`${climate.filter((c) => c === 'for').length} For votes, ${climate.filter((c) => c === 'against').length} Against votes`}>
            {climate.map((c, i) => <span key={i} className={`c-${c}`} />)}
          </div>
        </section>

        <section>
          <h2 className="sec-title">Debates</h2>
          {debates.length ? (
            <ul className="readings">
              {debates.map((m) => (
                <li key={m.id} className={themeOf(m).className}>
                  <Link to={m.status === 'closed' ? `/verdict/${m.id}` : `/match/${m.id}`}>
                    <span className="r-title">{m.title}<small>Argued {m.for === p.handle ? 'For' : 'Against'}, {m.when ?? 'live now'}</small></span>
                    <FrontBar share={m.share} />
                    <span className="r-num">{m.share}% for</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="empty">No matches yet. <Link to="/floor/compulsory-voting">Make a point on the open floor</Link> to get noticed.</p>}
        </section>
      </main>
    </>
  )
}
