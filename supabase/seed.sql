-- Demo content so the app isn't empty. Safe to run once on a fresh project.
-- Remove later with:  delete from auth.users where email like '%@demo.isobar.invalid';

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', id::uuid, 'authenticated', 'authenticated',
  handle || '@demo.isobar.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('handle', handle, 'full_name', name),
  now(), now(), '', '', '', ''
from (values
  ('00000000-0000-4000-a000-000000000001', 'priya', 'Priya Nair'),
  ('00000000-0000-4000-a000-000000000002', 'tom', 'Tom Okafor'),
  ('00000000-0000-4000-a000-000000000003', 'dana', 'Dana Wolfe'),
  ('00000000-0000-4000-a000-000000000004', 'marco', 'Marco Bell'),
  ('00000000-0000-4000-a000-000000000005', 'ines', 'Inès Haddad'),
  ('00000000-0000-4000-a000-000000000006', 'sam', 'Sam Reyes')
) as u(id, handle, name);

update public.profiles set bio = b.bio from (values
  ('priya', 'Policy researcher. Will cite the study.'),
  ('tom', 'Teacher. Argues for a living, unpaid.'),
  ('dana', 'Food writer. The hot dog question is not a joke.'),
  ('marco', 'Line cook, amateur logician.'),
  ('ines', 'Climate engineer.'),
  ('sam', 'Remote since 2019.')
) as b(handle, bio) where profiles.handle = b.handle;

-- motions: tallies are set straight from demo numbers (seed only; real tallies come from votes)
-- (two statements: tally rows are created by a trigger, which a single CTE statement can't see)
create temp table demo (slug text, title text, topic text, kind text, status text, palette text, for_wing text,
  for_h text, against_h text, starts_in interval, judges int, i_for int, i_against int, n_for int, n_against int);
insert into demo values
  ('social-under-16', 'Social media should be banned for under-16s', 'Tech', 'match', 'live', 'mono', null, 'priya', 'tom', interval '-20 minutes', 4312, 44, 31, 56, 41),
  ('hot-dog', 'A hot dog is a sandwich', 'Food', 'match', 'upcoming', 'mono', null, 'dana', 'marco', interval '5 hours', 1840, 30, 33, 30, 33),
  ('min-wage', 'The federal minimum wage should be $20 an hour', 'Politics', 'match', 'upcoming', 'party', 'left', 'sam', 'ines', interval '3 days', 2210, 39, 37, 39, 37),
  ('remote-work', 'Remote work is better for your career', 'Culture', 'match', 'upcoming', 'mono', null, 'sam', 'priya', interval '1 day', 960, 35, 40, 35, 40),
  ('nuclear', 'Nuclear power is our best answer to climate change', 'Science', 'match', 'closed', 'mono', null, 'ines', 'tom', interval '-1 day', 7218, 38, 41, 61, 35),
  ('tipping', 'Tipping culture has gone too far', 'Culture', 'match', 'closed', 'mono', null, 'marco', 'dana', interval '-3 days', 3120, 62, 20, 66, 31),
  ('compulsory-voting', 'Voting should be compulsory', 'Politics', 'floor', 'open', 'mono', null, null, null, null, 5602, 40, 46, 44, 50),
  ('pineapple', 'Pineapple belongs on pizza', 'Food', 'floor', 'open', 'mono', null, null, null, null, 9810, 48, 46, 49, 45),
  ('ai-art', 'AI art is real art', 'Tech', 'floor', 'open', 'mono', null, null, null, null, 6644, 36, 55, 36, 57),
  ('cats', 'Cats make better roommates than people', 'Culture', 'floor', 'open', 'mono', null, null, null, null, 2290, 55, 38, 57, 37),
  ('billionaires', 'Billionaires should not exist', 'Politics', 'floor', 'open', 'party', 'left', null, null, null, 8120, 50, 45, 52, 43),
  ('tax-cuts', 'Income tax cuts grow the economy', 'Politics', 'floor', 'open', 'party', 'right', null, null, null, 4410, 44, 50, 43, 51),
  ('oxford-comma', 'The Oxford comma is necessary', 'Culture', 'floor', 'open', 'mono', null, null, null, null, 1433, 63, 30, 64, 30),
  ('offside', 'Football should scrap the offside rule', 'Sport', 'floor', 'open', 'mono', null, null, null, null, 3077, 30, 62, 31, 63);

insert into public.motions (slug, title, topic, kind, status, palette, for_wing, created_by, for_user, against_user, starts_at)
  select d.slug, d.title, d.topic, d.kind, d.status, d.palette, d.for_wing,
    (select id from public.profiles where handle = coalesce(d.for_h, 'priya')),
    (select id from public.profiles where handle = d.for_h),
    (select id from public.profiles where handle = d.against_h),
    now() + d.starts_in
  from demo d;

update public.tallies t set
  initial_for = d.judges * d.i_for / 100,
  initial_against = d.judges * d.i_against / 100,
  initial_unsure = d.judges * (100 - d.i_for - d.i_against) / 100,
  now_for = d.judges * d.n_for / 100,
  now_against = d.judges * d.n_against / 100,
  now_unsure = d.judges * (100 - d.n_for - d.n_against) / 100,
  merit_for = d.judges * d.n_for / 130,
  merit_against = d.judges * d.n_against / 130,
  merit_even = d.judges / 5
from public.motions m join demo d using (slug)
where t.motion_id = m.id;

drop table demo;

insert into public.arguments (motion_id, user_id, side, body, backs)
select (select id from public.motions where slug = 'compulsory-voting'),
  (select id from public.profiles where handle = a.who), a.side::public.side, a.body, a.backs
from (values
  ('ines', 'for', 'Australia has done it since 1924. Turnout is above 90% and campaigns have to talk to everyone, not just their base.', 412),
  ('sam', 'for', 'If showing up is normal, nobody has to be persuaded that their vote matters. It just counts.', 188),
  ('tom', 'against', 'A right you are forced to use isn''t really a right. Not voting is also a choice.', 377),
  ('marco', 'against', 'You''d be adding millions of votes from people who picked the first name on the ballot.', 141),
  ('dana', 'against', 'Fix the reasons people don''t vote first: work hours, queues, distance.', 59)
) as a(who, side, body, backs);
