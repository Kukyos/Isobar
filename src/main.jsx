import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Feed from './pages/Feed.jsx'
import Match from './pages/Match.jsx'
import Floor from './pages/Floor.jsx'
import Verdict from './pages/Verdict.jsx'
import Profile from './pages/Profile.jsx'
import SignIn from './pages/SignIn.jsx'
import NewDebate from './pages/NewDebate.jsx'
import NotFound from './pages/NotFound.jsx'
import { configured } from './lib/supabase.js'
import { AuthProvider } from './lib/auth.jsx'
import './styles.css'

function Top() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname]) // braces: scrollTo returns a Promise in newer Chrome
  return null
}

function NotConfigured() {
  return (
    <main className="wrap gate">
      <h1 className="display-sm">Supabase isn't configured.</h1>
      <p className="lede">
        Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code> for
        local development, or in your Vercel project's environment variables, then rebuild.
      </p>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  !configured ? <NotConfigured /> : (
    <AuthProvider>
      <BrowserRouter>
        <Top />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/match/:id" element={<Match />} />
          <Route path="/floor/:id" element={<Floor />} />
          <Route path="/verdict/:id" element={<Verdict />} />
          <Route path="/u/:handle" element={<Profile />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/new" element={<NewDebate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
)
