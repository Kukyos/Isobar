import { Link, NavLink } from 'react-router-dom'
import { BRAND } from '../data.js'
import { useAuth } from '../lib/auth.jsx'

export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 20" aria-hidden="true">
      <path d="M2 10H30" stroke="currentColor" strokeWidth="2" />
      <path d="M4 10L9 2L14 10Z" fill="var(--a)" />
      <path d="M18 10A5 5 0 0 0 28 10Z" fill="var(--b)" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function Nav({ onDark = false }) {
  const { profile, ready } = useAuth()
  return (
    <header className={`nav ${onDark ? 'nav-on-front' : ''}`}>
      <Link to="/" className="brand"><Mark />{BRAND}</Link>
      <nav>
        <NavLink to="/feed">Forecast</NavLink>
        <NavLink to="/new">New debate</NavLink>
        {profile
          ? <NavLink to={`/u/${profile.handle}`} className="me" aria-label="Your profile">{profile.name[0]}</NavLink>
          : ready && <NavLink to="/signin">Sign in</NavLink>}
      </nav>
    </header>
  )
}

export function Footer() {
  return <footer className="foot wrap"><span>{BRAND} is in early access.</span><Link to="/feed">Forecast</Link></footer>
}

export function Loading({ what = 'Loading' }) {
  return <main className="wrap gate"><p className="lede" role="status">{what}…</p></main>
}

export function Failed({ error, retry }) {
  return (
    <main className="wrap gate">
      <h1 className="display-sm">That didn't load.</h1>
      <p className="lede">{error?.message ?? 'Something went wrong.'}</p>
      {retry && <div className="gate-btns"><button className="btn btn-ink" onClick={retry}>Try again</button></div>}
    </main>
  )
}
