import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="wrap gate">
        <h1 className="display-sm">This debate doesn't exist.</h1>
        <p className="lede"><Link to="/feed">Go to the forecast</Link> to find one that does.</p>
      </main>
    </>
  )
}
