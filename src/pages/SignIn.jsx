import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function SignIn() {
  const { user } = useAuth()
  const next = useLocation().state?.next ?? '/feed'
  const [mode, setMode] = useState('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState({})
  const [busy, setBusy] = useState(false)
  const back = `${location.origin}${next}`

  useEffect(() => { setMsg({}) }, [mode])
  if (user) return <Navigate to={next} replace />

  const run = async (fn, ok) => {
    setBusy(true); setMsg({})
    const { data, error } = await fn()
    setBusy(false)
    if (error) setMsg({ err: error.message })
    else if (ok && !data?.session) setMsg({ ok })
  }

  const oauth = (provider) => run(() => supabase.auth.signInWithOAuth({ provider, options: { redirectTo: back } }))
  const submit = (e) => {
    e.preventDefault()
    if (mode === 'in') run(() => supabase.auth.signInWithPassword({ email, password }))
    else run(() => supabase.auth.signUp({ email, password, options: { emailRedirectTo: back } }),
      'Check your email to confirm your account, then come back and sign in.')
  }
  const magic = () => {
    if (!email) return setMsg({ err: 'Enter your email first, then ask for a link.' })
    run(() => supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: back } }), `We sent a sign-in link to ${email}.`)
  }

  return (
    <>
      <Nav />
      <main className="wrap auth">
        <h1 className="page-title">{mode === 'in' ? 'Sign in' : 'Create an account'}</h1>
        <p className="lede">You need an account to vote, argue and open debates. Reading is free.</p>

        <div className="oauth">
          <button className="btn btn-ghost" onClick={() => oauth('google')} disabled={busy}>Continue with Google</button>
          <button className="btn btn-ghost" onClick={() => oauth('x')} disabled={busy}>Continue with X</button>
        </div>

        <form className="form" onSubmit={submit}>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <div className="form-foot">
            <button className="btn btn-ink" type="submit" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</button>
            <button className="btn btn-quiet" type="button" onClick={magic} disabled={busy}>Email me a sign-in link</button>
          </div>
          {msg.err && <p className="err" role="alert">{msg.err}</p>}
          {msg.ok && <p className="ok" role="status">{msg.ok}</p>}
        </form>

        <p className="switch">
          {mode === 'in' ? 'New here? ' : 'Already have an account? '}
          <button className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Create an account' : 'Sign in'}</button>
        </p>
      </main>
    </>
  )
}
