import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Feed from './pages/Feed.jsx'
import Match from './pages/Match.jsx'
import Floor from './pages/Floor.jsx'
import Verdict from './pages/Verdict.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'
import './styles.css'

function Top() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Top />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/match/:id" element={<Match />} />
      <Route path="/floor/:id" element={<Floor />} />
      <Route path="/verdict/:id" element={<Verdict />} />
      <Route path="/u/:handle" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)
