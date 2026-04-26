import type {
  ChordSpiritCard,
  SongSpellCard,
  ChordProgressionCard,
  MusicianCard,
  InstrumentCard,
  AnyCard,
} from '@/types';

// ─── Chord Spirit Cards ───────────────────────────────────────────────────────

export const CHORD_SPIRIT_CARDS: ChordSpiritCard[] = [
  {
    id: 'chord-I-Cmaj',
    name: 'Tonic Guardian',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'I',
    chordName: 'C Major',
    requiredNotes: ['C', 'E', 'G'],
    strength: 3,
    will: 3,
    keywords: ['Taunt'],
    abilityText: 'Taunt. Enemy Chord Spirits must challenge Tonic Guardian first.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a1a3e 0%, #2d4a7a 50%, #1a3a5c 100%)',
  },
  {
    id: 'chord-ii-Dmin',
    name: 'Fanfare Falcon',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'ii',
    chordName: 'D Minor',
    requiredNotes: ['D', 'F', 'A'],
    strength: 1,
    will: 2,
    keywords: [],
    abilityText: 'When Fanfare Falcon deals damage to a Chord Spirit, that spirit gets −1 will.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #2d1a4a 0%, #8B4513 40%, #d4af37 100%)',
  },
  {
    id: 'chord-iii-Emin',
    name: 'Flute Flies',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'iii',
    chordName: 'E Minor',
    requiredNotes: ['E', 'G', 'B'],
    strength: 2,
    will: 1,
    keywords: [],
    abilityText: 'Each time Flute Flies completes a challenge, it gains +1 will.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a3a1a 0%, #2d7a4a 50%, #8bc34a 100%)',
  },
  {
    id: 'chord-IV-Fmaj',
    name: 'Subdominant Sage',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'IV',
    chordName: 'F Major',
    requiredNotes: ['F', 'A', 'C'],
    strength: 2,
    will: 3,
    keywords: [],
    abilityText: 'When Subdominant Sage enters the field, draw 1 card from your deck.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #2a1a3a 0%, #5d3a8a 50%, #9d4edd 100%)',
  },
  {
    id: 'chord-V-Gmaj',
    name: 'Dominant Dragon',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'V',
    chordName: 'G Major',
    requiredNotes: ['G', 'B', 'D'],
    strength: 4,
    will: 2,
    keywords: ['Tempo'],
    abilityText: 'Tempo. Dominant Dragon may challenge the turn it is played.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #3a1a1a 0%, #8B0000 50%, #ff4500 100%)',
  },
  {
    id: 'chord-vi-Amin',
    name: 'Aeolian Fox',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'vi',
    chordName: 'A Minor',
    requiredNotes: ['A', 'C', 'E'],
    strength: 2,
    will: 2,
    keywords: [],
    abilityText: 'Whenever Aeolian Fox takes damage, restore 1 HP to your Musician.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 50%, #00bcd4 100%)',
  },
  {
    id: 'chord-vii-Bdim',
    name: 'Seventh Shadow',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'vii°',
    chordName: 'B Diminished',
    requiredNotes: ['B', 'D', 'F'],
    strength: 3,
    will: 1,
    keywords: ['Tempo'],
    abilityText: 'Tempo. When Seventh Shadow enters, deal 1 damage to a target Chord Spirit.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #4a0080 100%)',
  },
  {
    id: 'chord-ii7-Dmin7',
    name: 'Accidental Alligator',
    type: 'chord-spirit',
    key: 'C major',
    romanNumeral: 'ii⁷',
    chordName: 'D Minor 7th',
    requiredNotes: ['D', 'F', 'A', 'C'],
    strength: 5,
    will: 3,
    keywords: ['Transfer'],
    abilityText: 'Transfer. Excess strength beyond the will of blockers is transferred to the blocker\'s owner.',
    rarity: 'rare',
    artGradient: 'linear-gradient(135deg, #1a1a0a 0%, #4a3a0a 50%, #d4af37 100%)',
  },
];

// ─── Song Spell Cards ─────────────────────────────────────────────────────────

export const SONG_SPELL_CARDS: SongSpellCard[] = [
  {
    id: 'spell-vi-solar-flare',
    name: 'Solar Flare',
    type: 'song-spell',
    key: 'C major',
    romanNumeral: 'vi',
    requiredNotes: ['A', 'C', 'E'],
    effect: { kind: 'stat-buff', stat: 'strength', amount: 3, target: 'any-spirit' },
    abilityText: 'Target Chord Spirit gains +3 strength until the end of turn.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a0a00 0%, #7a3a00 40%, #ffa500 80%, #fff176 100%)',
  },
  {
    id: 'spell-iii-sunny-side-down',
    name: 'Sunny Side Down',
    type: 'song-spell',
    key: 'C major',
    romanNumeral: 'iii',
    requiredNotes: ['E', 'G', 'B'],
    effect: { kind: 'stat-debuff', stat: 'will', amount: 3, target: 'enemy-spirit' },
    abilityText: 'Target enemy Chord Spirit gets −3 will until the end of turn.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #0a0a1a 0%, #0a1a3a 50%, #1565c0 80%, #42a5f5 100%)',
  },
  {
    id: 'spell-I-resolve',
    name: 'Resolve',
    type: 'song-spell',
    key: 'C major',
    romanNumeral: 'I',
    requiredNotes: ['C', 'E', 'G'],
    effect: { kind: 'draw', amount: 2 },
    abilityText: 'Draw 2 cards from your deck.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #0a1a0a 0%, #1a4a2a 50%, #2e7d32 80%, #66bb6a 100%)',
  },
  {
    id: 'spell-IV-fortissimo',
    name: 'Fortissimo',
    type: 'song-spell',
    key: 'C major',
    romanNumeral: 'IV',
    requiredNotes: ['F', 'A', 'C'],
    effect: { kind: 'stat-buff', stat: 'strength', amount: 2, target: 'all-friendly' },
    abilityText: 'All your Chord Spirits gain +2 strength until end of turn.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #1a0a2a 0%, #4a1a6a 50%, #9c27b0 80%, #e040fb 100%)',
  },
  {
    id: 'spell-V-cadence',
    name: 'Perfect Cadence',
    type: 'song-spell',
    key: 'C major',
    romanNumeral: 'V',
    requiredNotes: ['G', 'B', 'D'],
    effect: { kind: 'damage', amount: 3, target: 'enemy-spirit' },
    abilityText: 'Deal 3 damage to target enemy Chord Spirit.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #1a0a00 0%, #5a2a00 50%, #e65100 80%, #ff8f00 100%)',
  },
];

// ─── Chord Progression Cards (Ultimates) ──────────────────────────────────────

export const CHORD_PROGRESSION_CARDS: ChordProgressionCard[] = [
  {
    id: 'prog-I-IV-stallion',
    name: "Sustainin' Stallion",
    type: 'chord-progression',
    key: 'C major',
    romanNumeral: 'I–IV',
    requiredNotes: [],
    requiredChordIds: ['chord-I-Cmaj', 'chord-IV-Fmaj'],
    isMinion: true,
    strength: 4,
    will: 4,
    keywords: [],
    abilityText: 'When Sustainin\' Stallion enters the field, you may search your deck for a Chord card and put it in your hand.',
    rarity: 'rare',
    artGradient: 'linear-gradient(135deg, #1a1a0a 0%, #3a3a00 30%, #7a6a00 60%, #d4af37 100%)',
  },
  {
    id: 'prog-I-V-vi-IV-anthem',
    name: 'Pop Anthem',
    type: 'chord-progression',
    key: 'C major',
    romanNumeral: 'I–V–vi–IV',
    requiredNotes: [],
    requiredChordIds: ['chord-I-Cmaj', 'chord-V-Gmaj', 'chord-vi-Amin', 'chord-IV-Fmaj'],
    isMinion: false,
    effect: { kind: 'stat-buff', stat: 'strength', amount: 3, target: 'all-friendly' },
    abilityText: 'All your Chord Spirits gain +3 strength and +2 will. Draw 2 cards.',
    rarity: 'legendary',
    artGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 25%, #2a1a5e 50%, #d4af37 75%, #fff176 100%)',
  },
  {
    id: 'prog-ii-V-I-jazz',
    name: 'Jazz Resolution',
    type: 'chord-progression',
    key: 'C major',
    romanNumeral: 'ii–V–I',
    requiredNotes: [],
    requiredChordIds: ['chord-ii-Dmin', 'chord-V-Gmaj', 'chord-I-Cmaj'],
    isMinion: true,
    strength: 6,
    will: 5,
    keywords: ['Tempo'],
    abilityText: 'Tempo. When Jazz Resolution challenges a spirit, deal 2 damage to the enemy hero as well.',
    rarity: 'rare',
    artGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 40%, #2a2a6e 70%, #6a6aee 100%)',
  },
];

// ─── All playable cards ───────────────────────────────────────────────────────
export const ALL_CARDS: AnyCard[] = [
  ...CHORD_SPIRIT_CARDS,
  ...SONG_SPELL_CARDS,
  ...CHORD_PROGRESSION_CARDS,
];

// ─── Starter Deck ─────────────────────────────────────────────────────────────
export const STARTER_DECK_IDS: string[] = [
  'chord-I-Cmaj',       // x2
  'chord-I-Cmaj',
  'chord-ii-Dmin',      // x3
  'chord-ii-Dmin',
  'chord-ii-Dmin',
  'chord-iii-Emin',     // x2
  'chord-iii-Emin',
  'chord-IV-Fmaj',      // x2
  'chord-IV-Fmaj',
  'chord-V-Gmaj',       // x2
  'chord-V-Gmaj',
  'chord-vi-Amin',      // x2
  'chord-vi-Amin',
  'chord-vii-Bdim',     // x1
  'chord-ii7-Dmin7',    // x1
  'spell-vi-solar-flare',    // x2
  'spell-vi-solar-flare',
  'spell-iii-sunny-side-down', // x2
  'spell-iii-sunny-side-down',
  'spell-I-resolve',    // x2
  'spell-I-resolve',
  'spell-IV-fortissimo', // x1
  'spell-V-cadence',    // x1
  'prog-I-IV-stallion', // x1
  'prog-ii-V-I-jazz',   // x1
];

// ─── Musicians ────────────────────────────────────────────────────────────────
export const MUSICIANS: MusicianCard[] = [
  {
    id: 'musician-sunslinger',
    name: 'The Sunslinger',
    subtitle: 'Musician',
    hp: 20,
    abilityText: 'BDF VII°: Target Chord Spirit gains Tempo (it may challenge as if it were played last turn).',
    abilityType: 'active',
    abilityEffect: undefined,
    artGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #4a1a6e 60%, #9d4edd 90%, #d4af37 100%)',
  },
  {
    id: 'musician-resonant',
    name: 'The Resonant',
    subtitle: 'Conductor',
    hp: 18,
    abilityText: 'Passive: Once per turn, when you play a Note Spirit, draw the top card of your deck.',
    abilityType: 'passive',
    artGradient: 'linear-gradient(135deg, #0a1a0a 0%, #0a2a1a 40%, #1a5a3a 70%, #2e7d32 100%)',
  },
  {
    id: 'musician-dissonant',
    name: 'The Dissonant',
    subtitle: 'Anti-Virtuoso',
    hp: 22,
    abilityText: 'Active: Choose a Chord Spirit. It gets −2 will until your next turn.',
    abilityType: 'active',
    artGradient: 'linear-gradient(135deg, #1a0a0a 0%, #3a0a0a 40%, #7a1a1a 70%, #c62828 100%)',
  },
];

// ─── Instruments ──────────────────────────────────────────────────────────────
export const INSTRUMENTS: InstrumentCard[] = [
  {
    id: 'instrument-southern-belle',
    name: 'Southern Belle',
    subtype: 'Guntar',
    allowedKey: 'C major',
    allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    abilityText: 'Play all 7 notes of the C major scale on the field to give all your Chord Spirits +1 strength and +1 will until end of turn.',
    abilityType: 'passive',
    artGradient: 'linear-gradient(135deg, #1a0a00 0%, #5a3000 40%, #8B4513 70%, #d4af37 100%)',
  },
  {
    id: 'instrument-minor-mandate',
    name: 'Minor Mandate',
    subtype: 'Electric Lute',
    allowedKey: 'A minor',
    allowedNotes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    abilityText: 'All your Chord Spirits in the A Minor family gain +1 strength.',
    abilityType: 'passive',
    artGradient: 'linear-gradient(135deg, #0a0a2a 0%, #1a1a5a 50%, #3a3a9a 80%, #7986cb 100%)',
  },
  {
    id: 'instrument-chromatic-cannon',
    name: 'Chromatic Cannon',
    subtype: 'Warhorn',
    allowedKey: 'Chromatic',
    allowedNotes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    abilityText: 'Your deck may include cards from any key. However, your Musician\'s max HP is reduced by 4.',
    abilityType: 'passive',
    artGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #444 80%, #888 100%)',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getCardById(id: string): AnyCard | undefined {
  return ALL_CARDS.find(c => c.id === id);
}

export function buildDeckFromIds(ids: string[]): AnyCard[] {
  return ids.map(id => getCardById(id)).filter(Boolean) as AnyCard[];
}

export function getStarterDeck(): AnyCard[] {
  return buildDeckFromIds(STARTER_DECK_IDS);
}

export function getStarterCollection(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of STARTER_DECK_IDS) {
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export function getAIDeck(): AnyCard[] {
  // AI uses a slightly different composition of the same starter cards
  const aiIds: string[] = [
    'chord-I-Cmaj', 'chord-I-Cmaj',
    'chord-ii-Dmin', 'chord-ii-Dmin',
    'chord-iii-Emin', 'chord-iii-Emin',
    'chord-IV-Fmaj', 'chord-IV-Fmaj',
    'chord-V-Gmaj', 'chord-V-Gmaj', 'chord-V-Gmaj',
    'chord-vi-Amin', 'chord-vi-Amin',
    'chord-ii7-Dmin7',
    'spell-vi-solar-flare', 'spell-vi-solar-flare',
    'spell-V-cadence', 'spell-V-cadence',
    'spell-iii-sunny-side-down',
    'spell-I-resolve',
    'prog-I-IV-stallion',
    'prog-ii-V-I-jazz',
  ];
  return buildDeckFromIds(aiIds);
}
