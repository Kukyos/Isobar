import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Nav, { Failed, Loading } from '../components/Nav.jsx'
import IsobarMap from '../components/IsobarMap.jsx'
import SideLabel from '../components/SideLabel.jsx'
import VotePanel from '../components/VotePanel.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { motionBySlug, must, useLive, useQuery, useVote } from '../lib/db.js'
import { themeOf } from '../lib/theme.js'
import NotFound from './NotFound.jsx'

const NAME = { for: 'For', against: 'Against' }
const ARG = '*, author:profiles!arguments_user_id_fkey(handle,name)'

export default function Floor() {
  const { id } = useParams()
  const q = useQuery(() => motionBySlug(id), [id])
  if (q.error) return <><Nav /><Failed error={q.error} retry={q.reload} /></>
  if (q.loading && !q.data) return <><Nav /><Loading /></>
  if (!q.data || q.data.kind !== 'floor') return <NotFound />
  return <FloorView key={q.data.id} base={q.data} />
}

function FloorView({ base }) {
  const m = useLive(base)
  const v = useVote(m.id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [args, setArgs] = useState(null)
  const [backed, setBacked] = useState({})
  const [tab, setTab] = useState('for')
  const [side, setSide] = useState('for')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [posted, setPosted] = useState('')

  useEffect(() => {
    must(supabase.from('arguments').select(ARG).eq('motion_id', m.id).order('backs', { ascending: false }))
      .then(setArgs, (e) => setError(e.message))
  }, [m.id])

  useEffect(() => {
    if (!user || !args?.length) return
    supabase.from('argument_backs').select('argument_id').eq('user_id', user.id).in('argument_id', args.map((a) => a.id))
      .then(({ data }) => setBacked(Object.fromEntries((data ?? []).map((b) => [b.argument_id, true]))))
  }, [user?.id, args?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const needSignIn = () => navigate('/signin', { state: { next: pathname } })

  async function back(a) {
    if (!user) return needSignIn()
    const on = !backed[a.id]
    setBacked((b) => ({ ...b, [a.id]: on }))
    setArgs((list) => list.map((x) => (x.id === a.id ? { ...x, backs: x.backs + (on ? 1 : -1) } : x)))
    const { error } = on
      ? await supabase.from('argument_backs').insert({ argument_id: a.id })
      : await supabase.from('argument_backs').delete().eq('argument_id', a.id).eq('user_id', user.id)
    if (error) setError(error.message)
  }

  async function post(e) {
    e.preventDefault()
    if (!user) return needSignIn()
    if (text.trim().length < 20) return setError('Write at least 20 characters so people know what you mean.')
    setError('')
    const { data, error } = await supabase.from('arguments').insert({ motion_id: m.id, side, body: text.trim() }).select(ARG).single()
    if (error) return setError(error.message)
    setArgs((a) => [data, ...a])
    setText(''); setTab(side)
    setPosted(`Argument posted to ${NAME[side]}.`)
  }

  const column = (s) => {
    const list = (args ?? []).filter((a) => a.side === s).sort((a, b) => b.backs - a.backs)
    return (
      <section className={`col col-${s}`} data-active={tab === s} aria-labelledby={`h-${s}`}>
        <h2 id={`h-${s}`} className="col-h">{NAME[s]}<span>{list.length} arguments</span></h2>
        {!args ? <p className="empty">Loading arguments…</p> : list.length ? (
          <ol className="args">
            {list.map((a) => (
              <li key={a.id} className="arg">
                <p>{a.body}</p>
                <div className="arg-foot">
                  <Link to={`/u/${a.author.handle}`}>{a.author.name}</Link>
                  <button className="strong" aria-pressed={!!backed[a.id]} onClick={() => back(a)}>Strong point {a.backs}</button>
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
        <IsobarMap id={m.slug} share={m.share} w={1200} h={420} />
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
        <div className="floor-top">
          <form className="compose" onSubmit={post}>
            <label htmlFor="arg">Add your argument</label>
            <textarea id="arg" rows="3" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)}
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
              <button className="btn btn-ink" type="submit">{user ? 'Post argument' : 'Sign in to post'}</button>
            </div>
            <p id="arg-err" className="err" aria-live="polite">{error}</p>
            <p className="ok" aria-live="polite">{posted}</p>
          </form>
          <aside className="crowd"><VotePanel m={m} v={v} /></aside>
        </div>

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
