import { Link } from 'react-router-dom'
import Nav, { Footer, Failed, Loading } from '../components/Nav.jsx'
import Front from '../components/Front.jsx'
import SideLabel from '../components/SideLabel.jsx'
import FrontBar from '../components/FrontBar.jsx'
import { Sky } from '../components/IsobarMap.jsx'
import { Storm } from './Feed.jsx'
import { listMotions, useLive, useQuery, useVote } from '../lib/db.js'
import { themeOf } from '../lib/theme.js'

export default function Landing() {
  const q = useQuery(listMotions, [])
  if (q.error) return <><Nav /><Failed error={q.error} retry={q.reload} /></>
  if (!q.data) return <><Nav /><Loading what="Loading the forecast" /></>

  const all = q.data
  const featured = all.find((m) => m.status === 'live') ?? all.find((m) => m.status === 'open')
  const upcoming = all.filter((m) => m.status === 'upcoming').slice(0, 3)
  const floor = all.filter((m) => m.kind === 'floor' && m.status === 'open').slice(0, 5)

  return (
    <>
      {featured ? <Hero m={featured} /> : <Nav />}
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

        {upcoming.length > 0 && (
          <section className="wrap">
            <div className="sec-head"><h2>Coming up</h2><Link to="/feed">Full forecast</Link></div>
            <div className="upcoming">{upcoming.map((m) => <Storm key={m.id} m={m} />)}</div>
          </section>
        )}

        <section className="wrap">
          <div className="sec-head"><h2>On the open floor</h2><Link to="/new">Open a motion</Link></div>
          <p className="sec-sub">No speakers, no clock. Anyone can add an argument and the best ones rise.</p>
          <ul className="readings">
            {floor.map((m) => (
              <li key={m.id} className={themeOf(m).className}>
                <Link to={`/floor/${m.slug}`}>
                  <span className="r-title">{m.title}</span>
                  <FrontBar share={m.share} />
                  <span className="r-num">{Math.round(m.share)}% for</span>
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

function Hero({ m: base }) {
  const m = useLive(base)
  const v = useVote(m.id)
  const isMatch = m.kind === 'match'
  return (
    <Front share={m.share} theme={themeOf(m)} className="hero">
      <Nav onDark />
      <div className="hero-in">
        <p className="live">
          {isMatch && <span className="pulse" aria-hidden="true" />}
          {isMatch ? 'Live now' : 'On the open floor'}, {m.judges.toLocaleString()} judging
        </p>
        <h1 className="motion-title">{m.title}</h1>
        {isMatch && m.for_profile && <p className="hero-who">{m.for_profile.name} for, {m.against_profile?.name} against</p>}
        <div className="sides">
          <SideLabel side="for" share={m.share} />
          <SideLabel side="against" share={100 - m.share} />
        </div>
        <div className="vote-row">
          <button className="btn btn-for" aria-pressed={v.vote?.side === 'for'} onClick={() => v.cast({ side: 'for' })}>Vote For</button>
          <button className="btn btn-against" aria-pressed={v.vote?.side === 'against'} onClick={() => v.cast({ side: 'against' })}>Vote Against</button>
          <Link className="btn btn-ghost" to={isMatch ? `/match/${m.slug}` : `/floor/${m.slug}`}>{isMatch ? 'Watch the match' : 'Read the arguments'}</Link>
        </div>
        <p className="hero-note" aria-live="polite">
          {v.error || (v.vote ? `You voted ${v.vote.side === 'for' ? 'For' : v.vote.side === 'against' ? 'Against' : 'not sure'}. You can change your mind until it closes.` : ' ')}
        </p>
      </div>
    </Front>
  )
}
