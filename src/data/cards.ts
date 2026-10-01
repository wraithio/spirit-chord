import type {
  ChordSpiritCard,
  SongSpiritCard,
  ChordSpellCard,
  MusicianCard,
  InstrumentCard,
  AnyCard,
} from '@/types';

// Card rules and stats: docs/rules.md §9 and §12

// ─── Chord Spirit Cards ───────────────────────────────────────────────────────

export const CHORD_SPIRIT_CARDS: ChordSpiritCard[] = [
  {
    id: 'chord-I-Cmaj',
    name: 'Tonic Guardian',
    type: 'chord-spirit',
    romanNumeral: 'I',
    chordName: 'C Major',
    requiredNotes: ['C', 'E', 'G'],
    power: 3,
    harmony: 0,
    keywords: [],
    abilityText: null,
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a1a3e 0%, #2d4a7a 50%, #1a3a5c 100%)',
  },
  {
    id: 'chord-V-Gmaj',
    name: 'Dominant Dragon',
    type: 'chord-spirit',
    romanNumeral: 'V',
    chordName: 'G Major',
    requiredNotes: ['G', 'B', 'D'],
    power: 2,
    harmony: 0,
    keywords: ['Tempo'],
    abilityText: 'Tempo. May attack the turn it is played.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #3a1a1a 0%, #8B0000 50%, #ff4500 100%)',
  },
  {
    id: 'chord-vi-Amin',
    name: 'Aeolian Fox',
    type: 'chord-spirit',
    romanNumeral: 'vi',
    chordName: 'A Minor',
    requiredNotes: ['A', 'C', 'E'],
    power: 1,
    harmony: 1,
    keywords: [],
    abilityText: 'Harmony. Cancels the first attack from the spirit across from it.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 50%, #00bcd4 100%)',
  },
  {
    id: 'chord-IV-Fmaj',
    name: 'Subdominant Sage',
    type: 'chord-spirit',
    romanNumeral: 'IV',
    chordName: 'F Major',
    requiredNotes: ['F', 'A', 'C'],
    power: 3,
    harmony: 0,
    keywords: [],
    abilityText: null,
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #2a1a3a 0%, #5d3a8a 50%, #9d4edd 100%)',
  },
];

// ─── Song Spirit Cards ────────────────────────────────────────────────────────

export const SONG_SPIRIT_CARDS: SongSpiritCard[] = [
  {
    id: 'song-sun-dragon',
    name: 'Sun Dragon',
    type: 'song-spirit',
    romanNumeral: 'I–V–vi–IV',
    requiredChordIds: ['chord-I-Cmaj', 'chord-V-Gmaj', 'chord-vi-Amin', 'chord-IV-Fmaj'],
    power: 7,
    harmony: 3,
    keywords: [],
    auraPower: 1,
    abilityText: 'Combine Tonic Guardian, Dominant Dragon, Aeolian Fox and Subdominant Sage from your board. Your other spirits get +1 Power. Once per game.',
    rarity: 'legendary',
    artGradient: 'linear-gradient(135deg, #0a0a0a 0%, #3a1a00 25%, #b8500c 55%, #d4af37 80%, #fff176 100%)',
  },
];

// ─── Chord Spell Cards ────────────────────────────────────────────────────────
// Names are placeholders.

export const CHORD_SPELL_CARDS: ChordSpellCard[] = [
  // Wave 1
  {
    id: 'spell-CEG-tonic-strike',
    name: 'Tonic Strike',
    type: 'chord-spell',
    romanNumeral: 'I',
    chordName: 'C Major',
    requiredNotes: ['C', 'E', 'G'],
    effect: { kind: 'damage', amount: 3, canTargetPlayers: false },
    abilityText: 'Deal 3 damage to target spirit.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a0a00 0%, #5a2a00 50%, #e65100 80%, #ff8f00 100%)',
  },
  {
    id: 'spell-GBD-crescendo',
    name: 'Crescendo',
    type: 'chord-spell',
    romanNumeral: 'V',
    chordName: 'G Major',
    requiredNotes: ['G', 'B', 'D'],
    effect: { kind: 'power', amount: 2 },
    abilityText: 'Target spirit gets +2 Power until end of turn.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a0a00 0%, #7a3a00 40%, #ffa500 80%, #fff176 100%)',
  },
  {
    id: 'spell-ACE-diminuendo',
    name: 'Diminuendo',
    type: 'chord-spell',
    romanNumeral: 'vi',
    chordName: 'A Minor',
    requiredNotes: ['A', 'C', 'E'],
    effect: { kind: 'power', amount: -2 },
    abilityText: 'Target spirit gets −2 Power until end of turn.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #0a0a1a 0%, #0a1a3a 50%, #1565c0 80%, #42a5f5 100%)',
  },
  {
    id: 'spell-FAC-sustain',
    name: 'Sustain',
    type: 'chord-spell',
    romanNumeral: 'IV',
    chordName: 'F Major',
    requiredNotes: ['F', 'A', 'C'],
    effect: { kind: 'attach', power: 1, spellproof: false },
    abilityText: 'Attach to target spirit. It gets +1 Power while attached. Counts as Harmony.',
    rarity: 'common',
    artGradient: 'linear-gradient(135deg, #1a0a2a 0%, #4a1a6a 50%, #9c27b0 80%, #e040fb 100%)',
  },
  // Wave 2
  {
    id: 'spell-CEG-fermata',
    name: 'Fermata',
    type: 'chord-spell',
    romanNumeral: 'I',
    chordName: 'C Major',
    requiredNotes: ['C', 'E', 'G'],
    effect: { kind: 'counter' },
    abilityText: 'Counter target chord spell. (Needs instant speed — not castable yet.)',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #0a1a0a 0%, #1a4a2a 50%, #2e7d32 80%, #66bb6a 100%)',
  },
  {
    id: 'spell-GBD-dissonance',
    name: 'Dissonance',
    type: 'chord-spell',
    romanNumeral: 'V',
    chordName: 'G Major',
    requiredNotes: ['G', 'B', 'D'],
    effect: { kind: 'remove-harmony' },
    abilityText: 'Remove all Harmony from target spirit, including Harmony attachments.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #1a0a0a 0%, #3a0a0a 40%, #7a1a1a 70%, #c62828 100%)',
  },
  {
    id: 'spell-ACE-minor-ward',
    name: 'Minor Ward',
    type: 'chord-spell',
    romanNumeral: 'vi',
    chordName: 'A Minor',
    requiredNotes: ['A', 'C', 'E'],
    effect: { kind: 'attach', power: 0, spellproof: true },
    abilityText: 'Attach to target spirit. It has Spellproof while attached. Counts as Harmony.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #0a0a2a 0%, #1a1a5a 50%, #3a3a9a 80%, #7986cb 100%)',
  },
  {
    id: 'spell-FAC-forte',
    name: 'Forte',
    type: 'chord-spell',
    romanNumeral: 'IV',
    chordName: 'F Major',
    requiredNotes: ['F', 'A', 'C'],
    effect: { kind: 'damage', amount: 2, canTargetPlayers: true },
    abilityText: 'Deal 2 damage to any target, including players.',
    rarity: 'uncommon',
    artGradient: 'linear-gradient(135deg, #1a0a00 0%, #4a1a00 40%, #b71c1c 75%, #ff5252 100%)',
  },
];

// ─── All playable cards ───────────────────────────────────────────────────────
export const ALL_CARDS: AnyCard[] = [
  ...CHORD_SPIRIT_CARDS,
  ...SONG_SPIRIT_CARDS,
  ...CHORD_SPELL_CARDS,
];

// ─── Starter Deck (45) ────────────────────────────────────────────────────────
// 4× each chord spirit, 1× Sun Dragon, 4× each spell except Fermata (needs instant speed)
const STARTER_SPELL_IDS = CHORD_SPELL_CARDS.filter(c => c.effect.kind !== 'counter').map(c => c.id);

export const STARTER_DECK_IDS: string[] = [
  ...CHORD_SPIRIT_CARDS.flatMap(c => Array(4).fill(c.id)),
  'song-sun-dragon',
  ...STARTER_SPELL_IDS.flatMap(id => Array(4).fill(id)),
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
  {
    id: 'instrument-excalibur',
    name: 'Excalibur',
    subtype: 'Solar Blade',
    allowedKey: 'C major',
    allowedNotes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    abilityText: 'No ability yet.',
    abilityType: 'passive',
    artGradient: 'linear-gradient(135deg, #1a1000 0%, #6a4a00 40%, #d4af37 75%, #fff8c4 100%)',
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
  return buildDeckFromIds(STARTER_DECK_IDS);
}
