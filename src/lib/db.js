import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabase.js'
import { useAuth } from './auth.jsx'

export const MOTION = '*, tallies(*), for_profile:profiles!motions_for_user_fkey(handle,name), against_profile:profiles!motions_against_user_fkey(handle,name)'

export async function must(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)

export function stats(t = {}) {
  const f = t.now_for ?? 0, a = t.now_against ?? 0, u = t.now_unsure ?? 0
  const i = (t.initial_for ?? 0) + (t.initial_against ?? 0) + (t.initial_unsure ?? 0)
  const mf = t.merit_for ?? 0, ma = t.merit_against ?? 0, me = t.merit_even ?? 0
  return {
    share: f + a ? (f / (f + a)) * 100 : 50,
    judges: f + a + u,
    before: { for: pct(t.initial_for, i), against: pct(t.initial_against, i), undecided: pct(t.initial_unsure, i) },
    after: { for: pct(f, f + a + u), against: pct(a, f + a + u), undecided: pct(u, f + a + u) },
    merit: { for: pct(mf, mf + ma + me), against: pct(ma, mf + ma + me), even: pct(me, mf + ma + me), count: mf + ma + me },
  }
}

export const shape = (m) => m && { ...m, ...stats(Array.isArray(m.tallies) ? m.tallies[0] : m.tallies ?? {}) }

export const listMotions = () =>
  must(supabase.from('motions').select(MOTION).order('created_at', { ascending: false }).limit(200)).then((r) => r.map(shape))

export const motionBySlug = (slug) =>
  must(supabase.from('motions').select(MOTION).eq('slug', slug).maybeSingle()).then(shape)

export function useQuery(run, deps) {
  const [state, setState] = useState({ loading: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true }))
    run().then((data) => live && setState({ data }), (error) => live && setState({ error }))
    return () => { live = false }
  }, [...deps, n]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: () => setN((x) => x + 1) }
}

// Merge live tally updates into a motion so the front moves as the room votes.
export function useLive(m) {
  const [t, setT] = useState(null)
  const id = m?.id
  useEffect(() => {
    setT(null)
    if (!id) return
    const ch = supabase.channel(`tally:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tallies', filter: `motion_id=eq.${id}` }, (p) => setT(p.new))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id])
  return m && t ? { ...m, ...stats(t) } : m
}

// Your vote on one motion. The first stance is the baseline; the database keeps it fixed.
export function useVote(motionId) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [vote, setVote] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setVote(null)
    if (!user || !motionId) return
    supabase.from('votes').select('*').eq('motion_id', motionId).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setVote(data))
  }, [motionId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function cast(patch) {
    if (!user) return navigate('/signin', { state: { next: pathname } })
    setError('')
    const q = vote
      ? supabase.from('votes').update(patch).eq('motion_id', motionId).eq('user_id', user.id)
      : supabase.from('votes').insert({ motion_id: motionId, initial_side: patch.side, ...patch })
    const { data, error } = await q.select().single()
    if (error) setError(error.message)
    else setVote(data)
  }
  return { vote, cast, error }
}

export function errorText(e) {
  return e?.message ?? 'Something went wrong.'
}
