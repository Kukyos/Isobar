import { Link, NavLink } from 'react-router-dom'
import { BRAND } from '../data.js'

export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 20" aria-hidden="true">
      <path d="M2 10H30" stroke="currentColor" strokeWidth="2" />
      <path d="M4 10L9 2L14 10Z" fill="var(--cold)" />
      <path d="M18 10A5 5 0 0 0 28 10Z" fill="var(--warm)" />
    </svg>
  )
}

export default function Nav({ onDark = false }) {
  return (
    <header className={`nav ${onDark ? 'nav-on-front' : ''}`}>
      <Link to="/" className="brand"><Mark />{BRAND}</Link>
      <nav>
        <NavLink to="/feed">Forecast</NavLink>
        <NavLink to="/floor/compulsory-voting">Open floor</NavLink>
        <NavLink to="/u/you" className="me" aria-label="Your profile">Y</NavLink>
      </nav>
    </header>
  )
}

export function Footer() {
  return <footer className="foot wrap"><span>{BRAND} is a prototype. Every debate here is made up.</span><Link to="/feed">Forecast</Link></footer>
}
