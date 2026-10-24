export const BRAND = 'Isobar'

export const people = {
  priya: { name: 'Priya Nair', handle: 'priya', wins: 14, losses: 6, minds: 3410, bio: 'Policy researcher. Will cite the study.' },
  tom: { name: 'Tom Okafor', handle: 'tom', wins: 11, losses: 9, minds: 2875, bio: 'Teacher. Argues for a living, unpaid.' },
  dana: { name: 'Dana Wolfe', handle: 'dana', wins: 22, losses: 4, minds: 6120, bio: 'Food writer. The hot dog question is not a joke.' },
  marco: { name: 'Marco Bell', handle: 'marco', wins: 7, losses: 8, minds: 1290, bio: 'Line cook, amateur logician.' },
  ines: { name: 'Inès Haddad', handle: 'ines', wins: 18, losses: 5, minds: 4404, bio: 'Climate engineer.' },
  sam: { name: 'Sam Reyes', handle: 'sam', wins: 9, losses: 10, minds: 1980, bio: 'Remote since 2019.' },
  you: { name: 'You', handle: 'you', wins: 3, losses: 2, minds: 214, bio: 'Judging since this week.' },
}

export const topics = ['All', 'Politics', 'Tech', 'Food', 'Culture', 'Science', 'Sport']

// share = For as a % of decided votes. before/after include undecided.
// palette: 'mono' (default) or 'party'; for_wing says which side is left-wing (US: left blue, right red).
export const motions = [
  {
    id: 'social-under-16', kind: 'match', status: 'live', topic: 'Tech',
    title: 'Social media should be banned for under-16s',
    for: 'priya', against: 'tom', judges: 4312, share: 58, round: 1, clock: 154,
    before: { for: 44, against: 31, undecided: 25 }, after: { for: 47, against: 50, undecided: 3 },
    transcript: [
      { who: 'priya', round: 0, text: 'We already set age limits for driving, drinking and gambling, because some products are built to be hard to stop using. Feeds are built the same way.' },
      { who: 'tom', round: 0, text: 'A ban doesn’t remove the feed. It moves teenagers to the corners of the internet with no moderation at all.' },
      { who: 'priya', round: 1, text: 'Tom’s argument is that enforcement is hard. Enforcement of seatbelts was hard too. We did it anyway.' },
      { who: 'tom', round: 1, text: 'Seatbelts don’t isolate you from your friends. For a lot of kids, the group chat is where their friends live.' },
    ],
    swings: ['212 judges moved to Against after Tom’s opening', '96 moved to For on the seatbelt point', '41 undecided judges picked a side'],
  },
  {
    id: 'hot-dog', kind: 'match', status: 'upcoming', topic: 'Food', when: 'Tonight, 9:00 pm',
    title: 'A hot dog is a sandwich', for: 'dana', against: 'marco', judges: 1840, share: 49,
    before: { for: 30, against: 33, undecided: 37 }, after: { for: 41, against: 52, undecided: 7 },
  },
  {
    id: 'min-wage', kind: 'match', status: 'upcoming', topic: 'Politics', when: 'Friday, 8:00 pm',
    palette: 'party', for_wing: 'left',
    title: 'The federal minimum wage should be $20 an hour', for: 'sam', against: 'ines', judges: 2210, share: 52,
    before: { for: 39, against: 37, undecided: 24 }, after: { for: 44, against: 51, undecided: 5 },
  },
  {
    id: 'remote-work', kind: 'match', status: 'upcoming', topic: 'Culture', when: 'Tomorrow, 7:30 pm',
    title: 'Remote work is better for your career', for: 'sam', against: 'priya', judges: 960, share: 44,
    before: { for: 35, against: 40, undecided: 25 }, after: { for: 48, against: 47, undecided: 5 },
  },
  {
    id: 'nuclear', kind: 'match', status: 'closed', topic: 'Science', when: 'Last night',
    title: 'Nuclear power is our best answer to climate change', for: 'ines', against: 'tom', judges: 7218, share: 64,
    before: { for: 38, against: 41, undecided: 21 }, after: { for: 61, against: 35, undecided: 4 },
  },
  {
    id: 'tipping', kind: 'match', status: 'closed', topic: 'Culture', when: 'Tuesday',
    title: 'Tipping culture has gone too far', for: 'marco', against: 'dana', judges: 3120, share: 71,
    before: { for: 62, against: 20, undecided: 18 }, after: { for: 66, against: 31, undecided: 3 },
  },
  {
    id: 'compulsory-voting', kind: 'floor', status: 'open', topic: 'Politics', judges: 5602, share: 47,
    title: 'Voting should be compulsory',
    args: [
      { id: 1, side: 'for', who: 'ines', score: 412, text: 'Australia has done it since 1924. Turnout is above 90% and campaigns have to talk to everyone, not just their base.' },
      { id: 2, side: 'for', who: 'sam', score: 188, text: 'If showing up is normal, nobody has to be persuaded that their vote matters. It just counts.' },
      { id: 3, side: 'against', who: 'tom', score: 377, text: 'A right you are forced to use isn’t really a right. Not voting is also a choice.' },
      { id: 4, side: 'against', who: 'marco', score: 141, text: 'You’d be adding millions of votes from people who picked the first name on the ballot.' },
      { id: 5, side: 'against', who: 'dana', score: 59, text: 'Fix the reasons people don’t vote first: work hours, queues, distance.' },
    ],
  },
  { id: 'pineapple', kind: 'floor', status: 'open', topic: 'Food', judges: 9810, share: 52, title: 'Pineapple belongs on pizza', args: [] },
  { id: 'ai-art', kind: 'floor', status: 'open', topic: 'Tech', judges: 6644, share: 39, title: 'AI art is real art', args: [] },
  { id: 'cats', kind: 'floor', status: 'open', topic: 'Culture', judges: 2290, share: 61, title: 'Cats make better roommates than people', args: [] },
  { id: 'billionaires', kind: 'floor', status: 'open', topic: 'Politics', palette: 'party', for_wing: 'left', judges: 8120, share: 55, title: 'Billionaires should not exist', args: [] },
  { id: 'tax-cuts', kind: 'floor', status: 'open', topic: 'Politics', palette: 'party', for_wing: 'right', judges: 4410, share: 46, title: 'Income tax cuts grow the economy', args: [] },
  { id: 'oxford-comma', kind: 'floor', status: 'open', topic: 'Culture', judges: 1433, share: 68, title: 'The Oxford comma is necessary', args: [] },
  { id: 'offside', kind: 'floor', status: 'open', topic: 'Sport', judges: 3077, share: 33, title: 'Football should scrap the offside rule', args: [] },
]

export const byId = (id) => motions.find((m) => m.id === id)
export const shareOf = (v) => (v.for / (v.for + v.against)) * 100

// Oxford-style: the side that gained the most points of the room wins
export function verdict(m) {
  const gFor = m.after.for - m.before.for, gAgainst = m.after.against - m.before.against
  const winner = gFor >= gAgainst ? 'for' : 'against'
  return { winner, gain: Math.max(gFor, gAgainst) }
}
