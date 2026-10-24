import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Nav, { Failed, Loading } from '../components/Nav.jsx'
import IsobarMap from '../components/IsobarMap.jsx'
import FrontBar from '../components/FrontBar.jsx'
import { verdict, when } from '../data.js'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { MOTION, must, shape, useQuery } from '../lib/db.js'
import { themeOf } from '../lib/theme.js'
import NotFound from './NotFound.jsx'

async function load(handle) {
  const p = await must(supabase.from('profiles').select('*').eq('handle', handle).maybeSingle())
  if (!p) return null
  const debates = await must(supabase.from('motions').select(MOTION)
    .or(`for_user.eq.${p.id},against_user.eq.${p.id},created_by.eq.${p.id}`).order('created_at', { ascending: false }))
  const { count } = await supabase.from('arguments').select('id', { count: 'exact', head: true }).eq('user_id', p.id)
  return { p, debates: debates.map(shape), args: count ?? 0 }
}

export default function Profile() {
  const { handle } = useParams()
  const q = useQuery(() => load(handle), [handle])
  if (q.error) return <><Nav /><Failed error={q.error} retry={q.reload} /></>
  if (q.loading && !q.data) return <><Nav /><Loading /></>
  if (!q.data) return <NotFound />
  return <ProfileView key={q.data.p.id} {...q.data} />
}

function ProfileView({ p, debates, args }) {
  const { user } = useAuth()
  const mine = user?.id === p.id
  const sideOf = (m) => (m.for_user === p.id ? 'for' : m.against_user === p.id ? 'against' : null)
  const matches = debates.filter((m) => m.kind === 'match' && sideOf(m))
  const results = matches.filter((m) => m.status === 'closed').map((m) => verdict(m).winner === sideOf(m))
  const wins = results.filter(Boolean).length

  return (
    <>
      <Nav />
      <header className="profile-head">
        <IsobarMap id={`user-${p.handle}`} share={results.length ? (wins / results.length) * 100 : 50} w={1200} h={360} />
        <div className="wrap profile-in">
          <span className="avatar avatar-lg" aria-hidden="true">{p.name[0]}</span>
          <div>
            <h1 className="page-title">{p.name}</h1>
            <p className="handle">@{p.handle}</p>
            {p.bio && <p className="lede">{p.bio}</p>}
          </div>
        </div>
      </header>
      <main className="wrap profile">
        <dl className="record">
          <div><dt>Wins</dt><dd>{wins}</dd></div>
          <div><dt>Losses</dt><dd>{results.length - wins}</dd></div>
          <div><dt>Arguments</dt><dd>{args}</dd></div>
        </dl>

        {mine && <Climate />}

        <section>
          <h2 className="sec-title">Debates</h2>
          {debates.length ? (
            <ul className="readings">
              {debates.map((m) => (
                <li key={m.id} className={themeOf(m).className}>
                  <Link to={m.status === 'closed' && m.kind === 'match' ? `/verdict/${m.slug}` : `/${m.kind}/${m.slug}`}>
                    <span className="r-title">{m.title}<small>{sideOf(m) ? `Argued ${sideOf(m) === 'for' ? 'For' : 'Against'}` : 'Opened this motion'}{m.starts_at && `, ${when(m.starts_at)}`}</small></span>
                    <FrontBar share={m.share} />
                    <span className="r-num">{Math.round(m.share)}% for</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="empty">No debates yet. {mine && <Link to="/new">Open a motion</Link>}</p>}
        </section>

        {mine && <EditProfile p={p} />}
      </main>
    </>
  )
}

function Climate() {
  const { user } = useAuth()
  const q = useQuery(() => must(supabase.from('votes').select('side').eq('user_id', user.id).neq('side', 'unsure').order('updated_at', { ascending: false }).limit(48)), [user.id])
  const votes = q.data ?? []
  if (!votes.length) return null
  return (
    <section>
      <h2 className="sec-title">Climate</h2>
      <p className="sec-sub">How you voted in your last {votes.length === 1 ? 'debate' : `${votes.length} debates`}. Dark is For, light is Against. Only you can see this.</p>
      <div className="climate" role="img" aria-label={`${votes.filter((v) => v.side === 'for').length} For votes, ${votes.filter((v) => v.side === 'against').length} Against votes`}>
        {votes.map((v, i) => <span key={i} className={`c-${v.side}`} />)}
      </div>
    </section>
  )
}

function EditProfile({ p }) {
  const { setProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: p.name, handle: p.handle, bio: p.bio })
  const [msg, setMsg] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    if (!/^[a-z0-9_]{3,20}$/.test(form.handle)) return setMsg({ err: 'Handles are 3 to 20 lowercase letters, numbers or underscores.' })
    const { data, error } = await supabase.from('profiles').update(form).eq('id', p.id).select().single()
    if (error) return setMsg({ err: error.code === '23505' ? 'That handle is taken.' : error.message })
    setProfile(data)
    setMsg({ ok: 'Profile saved.' })
    if (data.handle !== p.handle) navigate(`/u/${data.handle}`, { replace: true })
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <section>
      <h2 className="sec-title">Your profile</h2>
      <form className="form" onSubmit={save}>
        <label>Name<input value={form.name} onChange={set('name')} maxLength={60} required /></label>
        <label>Handle<input value={form.handle} onChange={set('handle')} maxLength={20} required /></label>
        <label>Bio<textarea rows="2" value={form.bio} onChange={set('bio')} maxLength={200} /></label>
        <div className="form-foot">
          <button className="btn btn-ink" type="submit">Save profile</button>
          <button className="btn btn-quiet" type="button" onClick={signOut}>Sign out</button>
        </div>
        {msg.err && <p className="err" role="alert">{msg.err}</p>}
        {msg.ok && <p className="ok" role="status">{msg.ok}</p>}
      </form>
    </section>
  )
}
