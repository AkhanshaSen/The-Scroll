export type Slot = 'noun' | 'verb' | 'adj'
export type Phase = 'open' | 'deep' | 'turn' | 'close'
export type Mood = 'plain' | 'wistful' | 'bright' | 'wild' | 'tender'

export type RhymeWord = { text: string; slot: Slot }
export type Family = { id: string; mood?: Exclude<Mood, 'plain'>; words: RhymeWord[] }
export type Pattern = { phase: Phase; slot: Slot; text: string }

export const FAMILIES: Family[] = [
  {
    id: 'ay',
    mood: 'bright',
    words: [
      { text: 'day', slot: 'noun' },
      { text: 'way', slot: 'noun' },
      { text: 'bay', slot: 'noun' },
      { text: 'play', slot: 'noun' },
      { text: 'stay', slot: 'verb' },
      { text: 'sway', slot: 'verb' },
      { text: 'pray', slot: 'verb' },
      { text: 'gray', slot: 'adj' },
    ],
  },
  {
    id: 'ain',
    mood: 'wistful',
    words: [
      { text: 'rain', slot: 'noun' },
      { text: 'train', slot: 'noun' },
      { text: 'pain', slot: 'noun' },
      { text: 'chain', slot: 'noun' },
      { text: 'remain', slot: 'verb' },
      { text: 'complain', slot: 'verb' },
      { text: 'wane', slot: 'verb' },
      { text: 'plain', slot: 'adj' },
    ],
  },
  {
    id: 'ight',
    mood: 'wistful',
    words: [
      { text: 'light', slot: 'noun' },
      { text: 'night', slot: 'noun' },
      { text: 'sight', slot: 'noun' },
      { text: 'flight', slot: 'noun' },
      { text: 'write', slot: 'verb' },
      { text: 'bite', slot: 'verb' },
      { text: 'bright', slot: 'adj' },
      { text: 'white', slot: 'adj' },
      { text: 'tight', slot: 'adj' },
    ],
  },
  {
    id: 'or',
    mood: 'wild',
    words: [
      { text: 'door', slot: 'noun' },
      { text: 'floor', slot: 'noun' },
      { text: 'shore', slot: 'noun' },
      { text: 'pour', slot: 'verb' },
      { text: 'soar', slot: 'verb' },
      { text: 'roar', slot: 'verb' },
    ],
  },
  {
    id: 'ee',
    mood: 'tender',
    words: [
      { text: 'sea', slot: 'noun' },
      { text: 'tree', slot: 'noun' },
      { text: 'tea', slot: 'noun' },
      { text: 'bee', slot: 'noun' },
      { text: 'flee', slot: 'verb' },
      { text: 'see', slot: 'verb' },
      { text: 'agree', slot: 'verb' },
      { text: 'free', slot: 'adj' },
    ],
  },
  {
    id: 'oom',
    mood: 'wistful',
    words: [
      { text: 'room', slot: 'noun' },
      { text: 'bloom', slot: 'noun' },
      { text: 'gloom', slot: 'noun' },
      { text: 'broom', slot: 'noun' },
      { text: 'bloom', slot: 'verb' },
      { text: 'assume', slot: 'verb' },
    ],
  },
  {
    id: 'ar',
    mood: 'bright',
    words: [
      { text: 'star', slot: 'noun' },
      { text: 'jar', slot: 'noun' },
      { text: 'car', slot: 'noun' },
      { text: 'scar', slot: 'noun' },
      { text: 'spar', slot: 'verb' },
      { text: 'mar', slot: 'verb' },
    ],
  },
  {
    id: 'ace',
    words: [
      { text: 'place', slot: 'noun' },
      { text: 'face', slot: 'noun' },
      { text: 'space', slot: 'noun' },
      { text: 'grace', slot: 'noun' },
      { text: 'chase', slot: 'verb' },
      { text: 'brace', slot: 'verb' },
      { text: 'erase', slot: 'verb' },
    ],
  },
  {
    id: 'eet',
    words: [
      { text: 'street', slot: 'noun' },
      { text: 'sheet', slot: 'noun' },
      { text: 'wheat', slot: 'noun' },
      { text: 'sleet', slot: 'noun' },
      { text: 'meet', slot: 'verb' },
      { text: 'greet', slot: 'verb' },
      { text: 'compete', slot: 'verb' },
      { text: 'sweet', slot: 'adj' },
      { text: 'neat', slot: 'adj' },
    ],
  },
  {
    id: 'ill',
    mood: 'tender',
    words: [
      { text: 'hill', slot: 'noun' },
      { text: 'mill', slot: 'noun' },
      { text: 'quill', slot: 'noun' },
      { text: 'sill', slot: 'noun' },
      { text: 'fill', slot: 'verb' },
      { text: 'spill', slot: 'verb' },
      { text: 'still', slot: 'adj' },
    ],
  },
  {
    id: 'ade',
    mood: 'wistful',
    words: [
      { text: 'shade', slot: 'noun' },
      { text: 'glade', slot: 'noun' },
      { text: 'blade', slot: 'noun' },
      { text: 'fade', slot: 'verb' },
      { text: 'wade', slot: 'verb' },
      { text: 'evade', slot: 'verb' },
      { text: 'afraid', slot: 'adj' },
    ],
  },
  {
    id: 'air',
    words: [
      { text: 'air', slot: 'noun' },
      { text: 'stair', slot: 'noun' },
      { text: 'chair', slot: 'noun' },
      { text: 'lair', slot: 'noun' },
      { text: 'care', slot: 'verb' },
      { text: 'share', slot: 'verb' },
      { text: 'stare', slot: 'verb' },
      { text: 'fair', slot: 'adj' },
      { text: 'rare', slot: 'adj' },
    ],
  },
  {
    id: 'ow',
    mood: 'bright',
    words: [
      { text: 'snow', slot: 'noun' },
      { text: 'crow', slot: 'noun' },
      { text: 'bow', slot: 'noun' },
      { text: 'shadow', slot: 'noun' },
      { text: 'know', slot: 'verb' },
      { text: 'grow', slot: 'verb' },
      { text: 'throw', slot: 'verb' },
      { text: 'show', slot: 'verb' },
      { text: 'slow', slot: 'adj' },
      { text: 'low', slot: 'adj' },
    ],
  },
  {
    id: 'ound',
    mood: 'wild',
    words: [
      { text: 'sound', slot: 'noun' },
      { text: 'ground', slot: 'noun' },
      { text: 'pound', slot: 'noun' },
      { text: 'mound', slot: 'noun' },
      { text: 'found', slot: 'verb' },
      { text: 'surround', slot: 'verb' },
      { text: 'resound', slot: 'verb' },
    ],
  },
  {
    id: 'eart',
    mood: 'tender',
    words: [
      { text: 'heart', slot: 'noun' },
      { text: 'part', slot: 'noun' },
      { text: 'start', slot: 'noun' },
      { text: 'cart', slot: 'noun' },
      { text: 'start', slot: 'verb' },
      { text: 'part', slot: 'verb' },
      { text: 'depart', slot: 'verb' },
      { text: 'smart', slot: 'adj' },
    ],
  },
  {
    id: 'ue',
    mood: 'tender',
    words: [
      { text: 'view', slot: 'noun' },
      { text: 'dew', slot: 'noun' },
      { text: 'clue', slot: 'noun' },
      { text: 'hue', slot: 'noun' },
      { text: 'pursue', slot: 'verb' },
      { text: 'renew', slot: 'verb' },
      { text: 'undo', slot: 'verb' },
      { text: 'true', slot: 'adj' },
      { text: 'blue', slot: 'adj' },
      { text: 'new', slot: 'adj' },
    ],
  },
  {
    id: 'eep',
    mood: 'wistful',
    words: [
      { text: 'sleep', slot: 'noun' },
      { text: 'sheep', slot: 'noun' },
      { text: 'keep', slot: 'verb' },
      { text: 'sleep', slot: 'verb' },
      { text: 'weep', slot: 'verb' },
      { text: 'sweep', slot: 'verb' },
      { text: 'deep', slot: 'adj' },
      { text: 'steep', slot: 'adj' },
    ],
  },
  {
    id: 'old',
    mood: 'wistful',
    words: [
      { text: 'gold', slot: 'noun' },
      { text: 'fold', slot: 'noun' },
      { text: 'hold', slot: 'verb' },
      { text: 'fold', slot: 'verb' },
      { text: 'scold', slot: 'verb' },
      { text: 'cold', slot: 'adj' },
      { text: 'old', slot: 'adj' },
      { text: 'bold', slot: 'adj' },
    ],
  },
  {
    id: 'and',
    mood: 'wild',
    words: [
      { text: 'hand', slot: 'noun' },
      { text: 'land', slot: 'noun' },
      { text: 'sand', slot: 'noun' },
      { text: 'stand', slot: 'noun' },
      { text: 'stand', slot: 'verb' },
      { text: 'land', slot: 'verb' },
      { text: 'expand', slot: 'verb' },
      { text: 'grand', slot: 'adj' },
      { text: 'bland', slot: 'adj' },
    ],
  },
  {
    id: 'ine',
    mood: 'wild',
    words: [
      { text: 'line', slot: 'noun' },
      { text: 'pine', slot: 'noun' },
      { text: 'vine', slot: 'noun' },
      { text: 'sign', slot: 'noun' },
      { text: 'shine', slot: 'verb' },
      { text: 'whine', slot: 'verb' },
      { text: 'decline', slot: 'verb' },
      { text: 'fine', slot: 'adj' },
      { text: 'divine', slot: 'adj' },
    ],
  },
]

export const PATTERNS: Pattern[] = [
  { phase: 'open', slot: 'noun', text: 'I leave {seed} beside the {end}' },
  { phase: 'open', slot: 'noun', text: 'A trace of {seed} collects near the {end}' },
  { phase: 'open', slot: 'noun', text: 'Between {seed} and the {end}' },
  { phase: 'open', slot: 'noun', text: 'I carry {seed} toward the {end}' },
  { phase: 'open', slot: 'noun', text: 'Someone set {seed} under the {end}' },
  { phase: 'open', slot: 'noun', text: '{seed} finds the long way to the {end}' },
  { phase: 'open', slot: 'noun', text: 'The evening walks {seed} past the {end}' },
  { phase: 'open', slot: 'noun', text: 'I fold {seed} into the {end}' },
  { phase: 'open', slot: 'noun', text: 'The hour arrives before the {end}' },
  { phase: 'open', slot: 'noun', text: 'Nothing is louder than the {end}' },
  { phase: 'deep', slot: 'noun', text: 'I follow {seed} as far as the {end}' },
  { phase: 'deep', slot: 'noun', text: 'What I call {seed} is almost the {end}' },
  { phase: 'deep', slot: 'noun', text: 'A pocket holds {seed} and the {end}' },
  { phase: 'deep', slot: 'noun', text: 'Night pins {seed} against the {end}' },
  { phase: 'deep', slot: 'noun', text: 'I keep saying {seed} toward the {end}' },
  { phase: 'deep', slot: 'noun', text: 'The room still keeps {seed} near the {end}' },
  { phase: 'deep', slot: 'noun', text: 'There is a lamp along the {end}' },
  { phase: 'deep', slot: 'noun', text: 'I stay a little near the {end}' },
  { phase: 'open', slot: 'verb', text: 'I let {seed} learn how to {end}' },
  { phase: 'open', slot: 'verb', text: 'Nobody taught {seed} when to {end}' },
  { phase: 'open', slot: 'verb', text: 'Watch {seed} hesitate, then {end}' },
  { phase: 'open', slot: 'verb', text: 'I ask {seed}, quietly, to {end}' },
  { phase: 'deep', slot: 'verb', text: 'Even {seed} will someday {end}' },
  { phase: 'deep', slot: 'verb', text: '{seed} tries again and starts to {end}' },
  { phase: 'deep', slot: 'verb', text: 'Some evenings only want to {end}' },
  { phase: 'deep', slot: 'verb', text: 'The room breathes in and starts to {end}' },
  { phase: 'open', slot: 'verb', text: 'I came this far in order to {end}' },
  { phase: 'deep', slot: 'verb', text: 'It takes a clumsy road and learns to {end}' },
  { phase: 'open', slot: 'adj', text: 'Not quite {seed}, and not yet {end}' },
  { phase: 'open', slot: 'adj', text: 'Call it {seed}, and call the rest {end}' },
  { phase: 'open', slot: 'adj', text: '{seed} at morning, {end} by dusk' },
  { phase: 'open', slot: 'adj', text: 'The room feels {seed}, then almost {end}' },
  { phase: 'deep', slot: 'adj', text: 'I find {seed} a little {end}' },
  { phase: 'deep', slot: 'adj', text: 'Everything named {seed} turns {end}' },
  { phase: 'deep', slot: 'adj', text: 'The afternoon grows nearly {end}' },
  { phase: 'deep', slot: 'adj', text: 'By the window, everything is {end}' },
  { phase: 'open', slot: 'adj', text: 'It is a clumsy kind of {end}' },
  { phase: 'deep', slot: 'adj', text: 'What the light leaves behind is {end}' },
  { phase: 'turn', slot: 'noun', text: 'And yet {seed} refuses the old {end}' },
  { phase: 'turn', slot: 'noun', text: 'But I would not trade {seed} for the {end}' },
  { phase: 'turn', slot: 'noun', text: 'Still, {seed} outlives the {end}' },
  { phase: 'turn', slot: 'noun', text: 'And look, {seed} was never just the {end}' },
  { phase: 'turn', slot: 'noun', text: 'And yet the turn was always the {end}' },
  { phase: 'turn', slot: 'noun', text: 'But morning has another {end}' },
  { phase: 'turn', slot: 'verb', text: 'And yet {seed} will not {end}' },
  { phase: 'turn', slot: 'verb', text: 'But I did not bring {seed} here to {end}' },
  { phase: 'turn', slot: 'verb', text: 'Still, clumsy {seed} begins to {end}' },
  { phase: 'turn', slot: 'verb', text: 'And yet who tells {seed} to {end}' },
  { phase: 'turn', slot: 'verb', text: 'And yet the honest thing is not to {end}' },
  { phase: 'turn', slot: 'verb', text: 'But something in the ink begins to {end}' },
  { phase: 'turn', slot: 'adj', text: 'And yet {seed} comes back {end}' },
  { phase: 'turn', slot: 'adj', text: 'Still, {seed} in this light looks {end}' },
  { phase: 'turn', slot: 'adj', text: 'But the room is less {seed} than {end}' },
  { phase: 'turn', slot: 'adj', text: 'And yet I find {seed} almost {end}' },
  { phase: 'turn', slot: 'adj', text: 'And yet the day itself is {end}' },
  { phase: 'turn', slot: 'adj', text: 'But what I mean is simpler, and {end}' },
  { phase: 'close', slot: 'noun', text: 'So take {seed}, imperfect as the {end}' },
  { phase: 'close', slot: 'noun', text: 'So leave {seed} where morning leaves the {end}' },
  { phase: 'close', slot: 'noun', text: 'So let {seed} belong beside the {end}' },
  { phase: 'close', slot: 'noun', text: 'So this is all I have to give the {end}' },
  { phase: 'close', slot: 'noun', text: 'So keep a little room beside the {end}' },
  { phase: 'close', slot: 'verb', text: 'So let {seed} be clumsy and {end}' },
  { phase: 'close', slot: 'verb', text: 'So I will keep {seed} and I will {end}' },
  { phase: 'close', slot: 'verb', text: 'So stay with {seed} long enough to {end}' },
  { phase: 'close', slot: 'verb', text: 'So let the last line learn to {end}' },
  { phase: 'close', slot: 'verb', text: 'So I will set the pencil down and {end}' },
  { phase: 'close', slot: 'adj', text: 'So {seed} is enough, and enough is {end}' },
  { phase: 'close', slot: 'adj', text: 'So call the whole day {seed} and {end}' },
  { phase: 'close', slot: 'adj', text: 'So this is {seed}, and this is {end}' },
  { phase: 'close', slot: 'adj', text: 'So let the ending be a little {end}' },
  { phase: 'close', slot: 'adj', text: 'So the last light is simply {end}' },
]

export const HAIKU_IMAGES: Record<Mood, string[]> = {
  plain: [
    'rain on the glass',
    'a cold cup',
    'at dusk',
    'the old window',
    'tea steam',
    'by the door',
    'softly',
    'one yellow lamp',
    'after dark',
    'in the kitchen',
    'a quiet room',
    'the long stair',
    'without a sound',
    'still waiting',
    'morning light',
    'an open letter',
    'the last bus',
    'under a coat',
    'a small belief',
    'not quite yet',
    'wind in the latch',
    'bread on the plate',
    'a borrowed pen',
    'falling quiet',
    'near the window',
    'again',
    'tonight',
    'the garden',
    'a wooden chair',
    'the evening',
    'half awake',
    'no reply',
    'the river',
    'a thin moon',
    'on the stove',
    'almost home',
    'the notebook',
    'a spare key',
    'city rain',
    'one more stop',
    'pale morning',
    'dust and sun',
    'the mailbox',
    'a low voice',
    'the staircase',
    'the teacup',
    'a gray hat',
    'still warm',
    'the curtain',
    'a moth',
    'the shade',
    'halfway',
    'I wait',
    'the clock',
  ],
  wistful: [
    'rain on the glass',
    'the empty chair',
    'a coat unclaimed',
    'fog in the lane',
    'the late window',
    'cold tea',
    'someone has gone',
    'the hall light',
    'a shut book',
    'winter glass',
    'no second note',
    'the platform',
    'dusk on the sill',
  ],
  bright: [
    'sun on the table',
    'a yellow bowl',
    'bread still warm',
    'the open door',
    'morning in the cup',
    'gold on the floor',
    'a laughed-at joke',
    'birds on the wire',
    'clean light',
    'the first peach',
    'shirts on the line',
  ],
  wild: [
    'wind at the latch',
    'the sea in the road',
    'a slammed gate',
    'thunder far off',
    'salt on the mouth',
    'the hill on fire',
    'waves in the dark',
    'a torn map',
    'rain running sideways',
    'the stove roaring',
  ],
  tender: [
    'tea in two cups',
    'a hand on the sleeve',
    'the lamp turned low',
    'bread for later',
    'your coat on the chair',
    'honey on the knife',
    'the spare key',
    'a mended hem',
    'soft talk',
    'the bed still warm',
    'one shared orange',
  ],
}

export const SEEDED_VERSE = [
  (seed: string) => `${cap(seed)} is not a clean word`,
  (seed: string) => `I set ${seed} down anyway`,
  (seed: string) => `somewhere ${seed} loses its shoes`,
  (seed: string) => `I meant to say ${seed}`,
  (seed: string) => `a margin note: ${seed}`,
  (seed: string) => `${seed}, if I'm honest`,
  (seed: string) => `the window keeps ${seed}`,
  (seed: string) => `with ${seed} in my pocket`,
  (seed: string) => `what ${seed} means, I almost know`,
  (seed: string) => `I found ${seed} where I left the light`,
]

export const FIXED_VERSE = [
  'and the day does not correct me',
  'and keeps walking',
  'what came out was the weather',
  'smudged, still readable',
  'which I am, intermittently',
  'on its side of the glass',
  'I am on the other',
  'clumsy as a key',
  'that fits on the second try',
  'so I leave the smudge',
  'the kettle agrees',
  'enough, for now',
]

export const LIMERICKS: ((seeds: string[]) => string)[] = [
  (s) => `There once was a word, ${s[0]}, on the stair
with ${s[1]} still caught in its hair.
It tried to look wise
and failed, to its surprise,
then sat down as if unaware.`,
  (s) => `A pocket of ${s[0]} slipped out for tea
with ${s[1]} it had meant to set free.
They missed every train
they had hoped to explain
and came home a little off-key.`,
  (s) => `I wrote ${s[0]} on the back of my hand,
then ${s[1]}, which I almost could stand.
The letters got smudged
when the afternoon budged
and neither one went as I planned.`,
  (s) => `There once was a kettle at three
that steeped ${s[0]} into ${s[1]} tea.
It whistled, it sighed,
it considered, then tried
to pretend it had somewhere to be.`,
  (s) => `There once was a ${s[0]} in a shoe
keeping ${s[1]} from knowing it too.
They shared the same lace
and a very small space
and a view of one scuffed avenue.`,
  (s) => `My ${s[0]} arrived slightly askew,
with ${s[1]} attached by the glue.
I turned them around
till they almost made sound
and the sound was a little untrue.`,
  (s) => `If ${s[0]} could borrow a hat
it would tip it toward ${s[1]}, like that.
They would stand in the square
with a dignified air
and be home before anyone sat.`,
  (s) => `The night put on ${s[0]} for a coat
and buttoned ${s[1]} up to the throat.
The sleeves were too long,
the buttons all wrong,
and the pockets had swallowed a note.`,
]

export const NOTES: Record<Mood, { open: string[]; mid: string[]; close: string[] }> = {
  plain: {
    open: [
      'These are the words I arrived with',
      'I am setting this down before I tidy it',
      'Here, without improving them',
    ],
    mid: [
      'They can sit together without being a thesis.',
      'I will not sand the clumsy edges off.',
      'The order is the order they showed up in.',
    ],
    close: [
      'That is already a kind of saying.',
      'The paper does not mind.',
      'I can always come back and write in the margin.',
    ],
  },
  wistful: {
    open: [
      'I am leaving these where the evening can find them',
      'Nothing here has been cheered up',
      'This is the unsorted missing',
    ],
    mid: [
      'The lonely part is usually the ordinary object, not the weather.',
      'I keep thinking a cleaner sentence would hurt less. It would not.',
      'The window has been doing this longer than I have.',
    ],
    close: [
      'So I will let the smudge stay.',
      'Come back when the kettle is louder than the thought.',
      'It is allowed to be a small sadness.',
    ],
  },
  bright: {
    open: [
      'Look, the day handed me these',
      'I caught these before they turned into chores',
      'A little brightness, badly spelled',
    ],
    mid: [
      'They do not need a speech. They need a windowsill.',
      'I am keeping the clumsy ones. They are the honest light.',
      'Even joy arrives with its shoes untied.',
    ],
    close: [
      'Leave them in the sun.',
      'That is plenty.',
      'Go on, then, while it is still warm.',
    ],
  },
  wild: {
    open: [
      'These came in with the weather',
      'I am not calming them down',
      'Write it while it is still moving',
    ],
    mid: [
      'A neat sentence would be a lie about this much wind.',
      'Let the line run until it is out of breath.',
      'The paper can take a little weather.',
    ],
    close: [
      'There. Still crackling.',
      'Roll it up before you tidy it.',
      'Enough storm for one sheet.',
    ],
  },
  tender: {
    open: [
      'For whoever finds this on the table',
      'I made this out of ordinary words',
      'A note, so I do not have to perform it',
    ],
    mid: [
      'You can be clumsy here. The affection still lands.',
      'I mean them the way a hand means a cup: carefully, a bit warm.',
      'Nothing grand. Just the words I actually had.',
    ],
    close: [
      'Come have tea if you want. The rest can wait.',
      'I am glad you are the one reading it.',
      'That is the whole message.',
    ],
  },
}

export const MOOD_WORDS: Record<Exclude<Mood, 'plain'>, string[]> = {
  wistful: ['lonely', 'alone', 'sad', 'miss', 'rain', 'grey', 'gray', 'lost', 'quiet', 'empty', 'cold', 'night', 'sigh', 'tear', 'gone', 'dark', 'window', 'blue', 'silence'],
  bright: ['sun', 'bright', 'joy', 'happy', 'laugh', 'gold', 'warm', 'dance', 'light', 'bloom', 'spring', 'yellow', 'smile', 'morning', 'song', 'shine'],
  wild: ['storm', 'fire', 'wild', 'run', 'sea', 'wind', 'rage', 'thunder', 'burn', 'wave', 'wolf', 'shout', 'crash', 'fierce'],
  tender: ['love', 'soft', 'heart', 'kiss', 'dear', 'gentle', 'hold', 'home', 'tea', 'hand', 'sleep', 'friend', 'honey', 'kind'],
}

export const FALLBACK_SEEDS: Record<Mood, string[]> = {
  plain: ['evening', 'window', 'quiet'],
  wistful: ['rain', 'window', 'lonely'],
  bright: ['morning', 'gold', 'light'],
  wild: ['wind', 'sea', 'storm'],
  tender: ['tea', 'hand', 'home'],
}

function cap(seed: string): string {
  if (seed === 'I') return seed
  return seed.charAt(0).toUpperCase() + seed.slice(1)
}
