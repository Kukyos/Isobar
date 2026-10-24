-- Isobar core: profiles, motions, votes + tallies, open-floor arguments.

-- internal functions live here: functions in public are callable through the API
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.side as enum ('for', 'against');
create type public.stance as enum ('for', 'against', 'unsure');

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  name text not null check (char_length(name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 200),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- New users get a profile. Handle comes from metadata when valid and free,
-- otherwise from the email / provider username plus a short random suffix.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := lower(meta ->> 'handle');
  base text;
  h text;
begin
  if wanted ~ '^[a-z0-9_]{3,20}$' and not exists (select 1 from public.profiles where handle = wanted) then
    h := wanted;
  else
    base := left(regexp_replace(lower(coalesce(meta ->> 'user_name', meta ->> 'preferred_username', split_part(new.email, '@', 1), 'judge')), '[^a-z0-9_]', '', 'g'), 14);
    if char_length(base) < 3 then base := 'judge'; end if;
    loop
      h := base || '_' || substr(md5(random()::text), 1, 4);
      exit when not exists (select 1 from public.profiles where handle = h);
    end loop;
  end if;

  insert into public.profiles (id, handle, name, avatar_url)
  values (
    new.id,
    h,
    left(coalesce(nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', ''), h), 60),
    meta ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- ---------- motions ----------
create table public.motions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(title) between 8 and 140),
  topic text not null check (topic in ('Politics', 'Tech', 'Food', 'Culture', 'Science', 'Sport')),
  kind text not null check (kind in ('match', 'floor')),
  -- mono = black/white; party = US colors, for_wing says which side is left-wing
  palette text not null default 'mono' check (palette in ('mono', 'party')),
  for_wing text check (for_wing in ('left', 'right')),
  status text not null default 'open' check (status in ('open', 'upcoming', 'live', 'closed')),
  created_by uuid not null default auth.uid() references public.profiles on delete cascade,
  for_user uuid references public.profiles on delete set null,
  against_user uuid references public.profiles on delete set null,
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  check ((palette = 'party') = (for_wing is not null))
);
create index on public.motions (status, created_at desc);

-- ---------- tallies (trigger-maintained, read-only to clients) ----------
create table public.tallies (
  motion_id uuid primary key references public.motions on delete cascade,
  initial_for int not null default 0,
  initial_against int not null default 0,
  initial_unsure int not null default 0,
  now_for int not null default 0,
  now_against int not null default 0,
  now_unsure int not null default 0,
  merit_for int not null default 0,
  merit_against int not null default 0,
  merit_even int not null default 0,
  updated_at timestamptz not null default now()
);

create function private.create_tally()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.tallies (motion_id) values (new.id);
  return new;
end;
$$;

create trigger on_motion_created
  after insert on public.motions
  for each row execute procedure private.create_tally();

-- ---------- votes ----------
-- side = "which side do you support", merit = "which side is making more valid points"
create table public.votes (
  motion_id uuid not null references public.motions on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  initial_side public.stance not null,
  side public.stance not null,
  merit text check (merit in ('for', 'against', 'even')),
  updated_at timestamptz not null default now(),
  primary key (motion_id, user_id)
);
create index on public.votes (user_id, updated_at desc);

-- the first vote is the baseline and never changes
create function private.keep_initial_side()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.initial_side := old.initial_side;
  new.updated_at := now();
  return new;
end;
$$;

create trigger votes_keep_initial
  before update on public.votes
  for each row execute procedure private.keep_initial_side();

create function private.tally_vote(r public.votes, d int)
returns void
language sql
security definer set search_path = ''
as $$
  update public.tallies set
    initial_for = initial_for + d * (r.initial_side = 'for')::int,
    initial_against = initial_against + d * (r.initial_side = 'against')::int,
    initial_unsure = initial_unsure + d * (r.initial_side = 'unsure')::int,
    now_for = now_for + d * (r.side = 'for')::int,
    now_against = now_against + d * (r.side = 'against')::int,
    now_unsure = now_unsure + d * (r.side = 'unsure')::int,
    merit_for = merit_for + d * (r.merit is not distinct from 'for')::int,
    merit_against = merit_against + d * (r.merit is not distinct from 'against')::int,
    merit_even = merit_even + d * (r.merit is not distinct from 'even')::int,
    updated_at = now()
  where motion_id = r.motion_id;
$$;

create function private.on_vote_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform private.tally_vote(old, -1); end if;
  if tg_op in ('INSERT', 'UPDATE') then perform private.tally_vote(new, 1); end if;
  return null;
end;
$$;

create trigger votes_tally
  after insert or update or delete on public.votes
  for each row execute procedure private.on_vote_change();

-- ---------- open-floor arguments ----------
create table public.arguments (
  id uuid primary key default gen_random_uuid(),
  motion_id uuid not null references public.motions on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  side public.side not null,
  body text not null check (char_length(body) between 20 and 1000),
  backs int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.arguments (motion_id, backs desc);

create table public.argument_backs (
  argument_id uuid not null references public.arguments on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  primary key (argument_id, user_id)
);

create function private.on_back_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.arguments
  set backs = backs + (case when tg_op = 'INSERT' then 1 else -1 end)
  where id = coalesce(new.argument_id, old.argument_id);
  return null;
end;
$$;

create trigger backs_count
  after insert or delete on public.argument_backs
  for each row execute procedure private.on_back_change();

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.motions enable row level security;
alter table public.tallies enable row level security;
alter table public.votes enable row level security;
alter table public.arguments enable row level security;
alter table public.argument_backs enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "edit own profile" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "motions are public" on public.motions for select using (true);
-- phase 3: anyone signed in can open a floor motion; matches arrive with the challenge flow
create policy "open a floor motion" on public.motions for insert to authenticated
  with check (
    created_by = (select auth.uid()) and kind = 'floor' and status = 'open'
    and for_user is null and against_user is null
  );

create policy "tallies are public" on public.tallies for select using (true);

-- votes are private: you only ever read your own
create policy "read own votes" on public.votes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "cast a vote" on public.votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.motions m where m.id = motion_id and m.status <> 'closed')
  );
create policy "change your vote" on public.votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.motions m where m.id = motion_id and m.status <> 'closed')
  );

create policy "arguments are public" on public.arguments for select using (true);
create policy "post an argument" on public.arguments for insert to authenticated
  with check (
    user_id = (select auth.uid()) and backs = 0
    and exists (select 1 from public.motions m where m.id = motion_id and m.kind = 'floor' and m.status = 'open')
  );
create policy "delete own argument" on public.arguments for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "backs are public" on public.argument_backs for select using (true);
create policy "back an argument" on public.argument_backs for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "unback an argument" on public.argument_backs for delete to authenticated
  using (user_id = (select auth.uid()));

-- live front movement
alter publication supabase_realtime add table public.tallies;
