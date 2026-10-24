import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav, { Footer } from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import SideLabel from '../components/SideLabel.jsx'
import FrontBar from '../components/FrontBar.jsx'
import { Sky } from '../components/IsobarMap.jsx'
import { Storm } from './Feed.jsx'
import { motions, people } from '../data.js'
import { themeOf } from '../lib/theme.js'
import { useLiveShare } from '../lib/useLive.js'

const live = motions.find((m) => m.status === 'live')

export default function Landing() {
  const [share, nudge] = useLiveShare(live.share)
  const [mine, setMine] = useState(null)
  const vote = (side) => {
    if (mine === side) return
    nudge(side === 'for' ? 4 : -4)
    setMine(side)
  }
  const upcoming = motions.filter((m) => m.status === 'upcoming')
  const floor = motions.filter((m) => m.kind === 'floor').slice(0, 5)

  return (
    <>
      <Front share={share} theme={themeOf(live)} className="hero">
        <Nav onDark />
        <div className="hero-in">
          <p className="live"><span className="pulse" aria-hidden="true" />Live now, {live.judges.toLocaleString()} people judging</p>
          <h1 className="motion-title">{live.title}</h1>
          <p className="hero-who">{people[live.for].name} for, {people[live.against].name} against</p>
          <div className="sides">
            <SideLabel side="for" share={share} />
            <SideLabel side="against" share={100 - share} />
          </div>
          <div className="vote-row">
            <button className="btn btn-for" aria-pressed={mine === 'for'} onClick={() => vote('for')}>Vote For</button>
            <button className="btn btn-against" aria-pressed={mine === 'against'} onClick={() => vote('against')}>Vote Against</button>
            <Link className="btn btn-ghost" to={`/match/${live.id}`}>Watch the match</Link>
          </div>
          <p className="hero-note" aria-live="polite">
            {mine ? `You voted ${mine === 'for' ? 'For' : 'Against'}. You can change your mind until the closing round ends.` : ' '}
          </p>
        </div>
      </Front>

      <main>
        <section className="pitch wrap">
          <h2 className="display">Settle it in public.</h2>
          <p className="lede">Two people argue. Everyone watching is the judge. You vote before it starts and again at the end. The side that changes the most minds wins, not the side that started ahead.</p>
        </section>

        <section className="how wrap">
          <ol className="steps">
            <li><h3>Pick a side</h3><p>Before the first word, say where you stand. Not sure is a fine answer.</p><FrontBar share={58} /></li>
            <li><h3>Watch three rounds</h3><p>Opening, rebuttal, closing. Each speaker gets the same clock.</p><FrontBar share={52} /></li>
            <li><h3>Vote again</h3><p>Stay put or switch. Every switch moves the front for everyone watching.</p><FrontBar share={47} /></li>
            <li><h3>See the swing</h3><p>Whoever gained the most ground wins, even if they started behind.</p><FrontBar share={47} was={58} /></li>
          </ol>
          <figure className="how-art">
            <Sky src="/img/front-sky.jpg" id="how-it-works" share={52} />
          </figure>
        </section>

        <section className="wrap">
          <div className="sec-head"><h2>Coming up</h2><Link to="/feed">Full forecast</Link></div>
          <div className="upcoming">
            {upcoming.map((m) => <Storm key={m.id} m={m} />)}
          </div>
        </section>

        <section className="wrap">
          <div className="sec-head"><h2>On the open floor</h2><Link to="/feed">All motions</Link></div>
          <p className="sec-sub">No speakers, no clock. Anyone can add an argument and the best ones rise.</p>
          <ul className="readings">
            {floor.map((m) => (
              <li key={m.id} className={themeOf(m).className}>
                <Link to={`/floor/${m.id}`}>
                  <span className="r-title">{m.title}</span>
                  <FrontBar share={m.share} />
                  <span className="r-num">{m.share}% for</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  )
}
