import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const Auth = createContext({ user: null, profile: null, ready: false })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const uid = session?.user.id

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!uid) return setProfile(null)
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => setProfile(data))
  }, [uid])

  return <Auth.Provider value={{ user: session?.user ?? null, profile, setProfile, ready }}>{children}</Auth.Provider>
}

export const useAuth = () => useContext(Auth)
