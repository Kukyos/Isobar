# Isobar build plan

Each phase is finished and checked before the next one starts. Each phase lives on its own branch, which gets a Vercel preview, and is merged to `main` once it works.

## 1. Retheme (`retheme`)
- Debates have `palette: 'mono' | 'party'`. A party debate also has `for_wing: 'left' | 'right'`, because For isn't inherently left.
- Mono is the default look: a black (For) and white (Against) air mass. Party debates use US colors: left is blue, right is red.
- The side colors come from per-debate CSS tokens (`--a*` For, `--b*` Against) and shader uniforms.
- Text over the fluid: in mono it is white with `mix-blend-mode: difference`, so it is readable on both masses. In party mode it is white, on deep red or blue (at least 4.9:1).

## 2. Supabase foundation (`backend`)
- `@supabase/supabase-js` client, reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`.
- If those are missing, the app shows a clear "Supabase isn't configured" screen instead of a blank page.
- SQL migrations in `supabase/migrations/`, with RLS on every table. `profiles` is created automatically on sign-up.
- Auth: email + password and magic link. Google and X need provider setup in the Supabase dashboard (user).
- `supabase/seed.sql` loads the current demo debates. Developed against local `npx supabase start` (Docker).

## 3. Votes, open floor, creating debates
- `votes (motion_id, user_id)` stores `initial_side` (fixed once set), the current `side`, and `merit`. `merit` answers "which side is making more valid points", separately from "which side do you support".
- Counts live in a trigger-maintained `tallies` table that clients can't write to. Clients subscribe to it over Realtime.
- `arguments` plus `argument_backs` ("Strong point").
- Create-debate form: title, topic, palette and the left/right mapping, and match or open floor.

## 4. Text matches
- Challenge flow: create a match, name or invite an opponent, the opponent accepts, then the match is scheduled.
- Turns are written only through a `security definer` RPC that checks it really is your turn and round.
- The clock is computed from the server's `turn_started_at`.
- When a match closes, the verdict is computed from initial vs final votes (Oxford swing).

## 5. AI (Groq via Supabase Edge Functions)
- `fact-check`: runs on each new turn or argument. It extracts claims, checks them with a search-capable Groq model, and writes `fact_checks` rows that clients receive over Realtime. A claim with no source is marked unverified.
- `judge`: runs at the end of each round. It writes `ai_judgments`, scoring each side on valid points.
- Each user is rate-limited, so nobody can burn the Groq quota.

## 6. Live video (LiveKit Cloud)
- A `livekit-token` Edge Function mints tokens. Speakers can publish; the audience can only subscribe.
- Audio fact checks: the speaker's browser sends audio chunks to an Edge Function, which transcribes them with Groq Whisper and feeds the text to `fact-check`.

## Secrets (set by the user; never in chat or git)
- `.env.local` and the Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase secrets: `GROQ_API_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`.
