// Run against the LOCAL stack only:  npx supabase start  then  node supabase/tests/rls.check.mjs
// Uses the local stack's well-known dev keys from `supabase status`.
import assert from 'node:assert'
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }).match(/\{[\s\S]*\}/)[0])
assert.match(env.API_URL, /127\.0\.0\.1|localhost/, 'refusing to run against a non-local project')

const client = () => createClient(env.API_URL, env.PUBLISHABLE_KEY ?? env.ANON_KEY, { auth: { persistSession: false } })
const anon = client()
const me = client()
const email = `check_${Date.now()}@example.com`
const { error: signUpErr } = await me.auth.signUp({ email, password: 'check-password-123', options: { data: { full_name: 'Check Bot' } } })
assert.ifError(signUpErr)
const { data: { user } } = await me.auth.getUser()

const { data: profile } = await me.from('profiles').select('*').eq('id', user.id).single()
assert.match(profile.handle, /^check_/, 'profile created with a handle')

const motion = async (slug) => (await me.from('motions').select('id, tallies(*)').eq('slug', slug).single()).data
const open = await motion('pineapple')
const before = open.tallies.now_for

// vote, then switch: baseline stays, tallies follow
assert.ifError((await me.from('votes').insert({ motion_id: open.id, initial_side: 'for', side: 'for' })).error)
assert.equal((await motion('pineapple')).tallies.now_for, before + 1, 'vote counted')
const { data: switched } = await me.from('votes').update({ side: 'against', initial_side: 'against', merit: 'even' }).eq('motion_id', open.id).select().single()
assert.equal(switched.initial_side, 'for', 'baseline cannot be rewritten')
const t = (await motion('pineapple')).tallies
assert.equal(t.now_for, before, 'switching moves the vote out of For')
assert.ok(t.merit_even > 0, 'merit counted')

// things nobody may do
const closed = await motion('nuclear')
assert.ok((await me.from('votes').insert({ motion_id: closed.id, initial_side: 'for', side: 'for' })).error, 'no voting on closed debates')
const tamper = await me.from('tallies').update({ now_for: 999999 }).eq('motion_id', open.id).select()
assert.equal(tamper.data?.length ?? 0, 0, 'clients cannot write tallies')
assert.ok((await me.rpc('tally_vote', { r: null, d: 1000 })).error, 'internal functions are not exposed')
assert.equal((await anon.from('votes').select('*')).data?.length ?? 0, 0, 'votes are private')
assert.ok((await anon.from('arguments').insert({ motion_id: open.id, side: 'for', body: 'x'.repeat(30) })).error, 'anon cannot post')

// arguments and backs
const { data: arg, error: argErr } = await me.from('arguments').insert({ motion_id: open.id, side: 'for', body: 'Sweet and salty is a classic pairing for a reason.' }).select().single()
assert.ifError(argErr)
assert.ifError((await me.from('argument_backs').insert({ argument_id: arg.id })).error)
assert.equal((await me.from('arguments').select('backs').eq('id', arg.id).single()).data.backs, 1, 'back counted')
assert.ok((await me.from('arguments').insert({ motion_id: open.id, side: 'for', body: 'Stuffing the count please.', backs: 500 })).error, 'cannot preset backs')

// creating a floor motion
const { error: createErr } = await me.from('motions').insert({ slug: `check-${Date.now()}`, title: 'Checks should always pass', topic: 'Tech', kind: 'floor', status: 'open' })
assert.ifError(createErr)
assert.ok((await me.from('motions').insert({ slug: `check-m-${Date.now()}`, title: 'A match nobody accepted', topic: 'Tech', kind: 'match', status: 'live' })).error, 'cannot create live matches directly')

console.log('rls ok')
