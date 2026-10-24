import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { slugify, topics } from '../data.js'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function NewDebate() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', topic: 'Politics', palette: 'mono', for_wing: 'left' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (ready && !user) return <Navigate to="/signin" state={{ next: '/new' }} replace />

  async function submit(e) {
    e.preventDefault()
    const title = form.title.trim()
    if (title.length < 8) return setError('Write the motion as a full statement, at least 8 characters.')
    const row = {
      slug: slugify(title), title, topic: form.topic, kind: 'floor', status: 'open', palette: form.palette,
      for_wing: form.palette === 'party' ? form.for_wing : null,
    }
    const { error } = await supabase.from('motions').insert(row)
    if (error) return setError(error.message)
    navigate(`/floor/${row.slug}`)
  }

  return (
    <>
      <Nav />
      <main className="wrap auth">
        <h1 className="page-title">Open a motion</h1>
        <p className="lede">Write one statement people can be for or against. It goes on the open floor, where anyone can argue and vote.</p>
        <form className="form" onSubmit={submit}>
          <label>Motion
            <input value={form.title} onChange={set('title')} maxLength={140} placeholder="Homework should be banned in primary school" required />
          </label>
          <label>Topic
            <select value={form.topic} onChange={set('topic')}>
              {topics.filter((t) => t !== 'All').map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <fieldset className="pick pick-col">
            <legend>Colors</legend>
            <label><input type="radio" name="palette" value="mono" checked={form.palette === 'mono'} onChange={set('palette')} />Neutral: black and white</label>
            <label><input type="radio" name="palette" value="party" checked={form.palette === 'party'} onChange={set('palette')} />Political: blue for left, red for right</label>
          </fieldset>
          {form.palette === 'party' && (
            <fieldset className="pick pick-col">
              <legend>Which side is the left-wing position?</legend>
              <label><input type="radio" name="wing" value="left" checked={form.for_wing === 'left'} onChange={set('for_wing')} />For is left, so For is blue</label>
              <label><input type="radio" name="wing" value="right" checked={form.for_wing === 'right'} onChange={set('for_wing')} />For is right, so For is red</label>
            </fieldset>
          )}
          <div className="form-foot"><button className="btn btn-ink" type="submit">Open motion</button></div>
          {error && <p className="err" role="alert">{error}</p>}
        </form>
      </main>
    </>
  )
}
