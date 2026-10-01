// Game rules: docs/rules.md

// ─── Notes ──────────────────────────────────────────────────────────────────
export type NoteId = 'C' | 'Cs' | 'D' | 'Ds' | 'E' | 'F' | 'Fs' | 'G' | 'Gs' | 'A' | 'As' | 'B';

// A pitch class. Notes are resources in a player's reserve/pool, never cards or spirits.
export interface NoteDef {
  id: NoteId;
  name: string;          // "C#/Db"
  primaryNote: string;   // "C#"
  altNote: string;       // "Db"
  semitone: number;      // 0–11
  frequency: number;     // Hz (C4 octave)
  color: string;         // CSS color for UI
  artGradient: string;
}

export type NoteCounts = Partial<Record<NoteId, number>>;

// ─── Cards ──────────────────────────────────────────────────────────────────
export type CardType = 'chord-spirit' | 'song-spirit' | 'chord-spell';

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  romanNumeral: string;  // "I", "ii", "I–V–vi–IV"
  artGradient: string;   // CSS gradient for placeholder art
  abilityText: string | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface ChordSpiritCard extends BaseCard {
  type: 'chord-spirit';
  chordName: string;       // "C Major"
  requiredNotes: string[]; // e.g. ['C','E','G']
  power: number;
  harmony: number;
  keywords: Keyword[];
}

// Cast by combining chord spirits already on your board (e.g. the Sun Dragon)
export interface SongSpiritCard extends BaseCard {
  type: 'song-spirit';
  requiredChordIds: string[];
  power: number;
  harmony: number;
  keywords: Keyword[];
  auraPower: number;       // bonus Power for your other spirits
}

export interface ChordSpellCard extends BaseCard {
  type: 'chord-spell';
  chordName: string;
  requiredNotes: string[]; // also identifies which chord spirit can be tapped to pay for it
  effect: SpellEffect;
}

export type AnyCard = ChordSpiritCard | SongSpiritCard | ChordSpellCard;
export type SpiritCard = ChordSpiritCard | SongSpiritCard;

export type Keyword = 'Tempo' | 'Spellproof';

export type SpellEffect =
  | { kind: 'damage'; amount: number; canTargetPlayers: boolean }
  | { kind: 'power'; amount: number }                         // until end of turn
  | { kind: 'attach'; power: number; spellproof: boolean }    // counts as Harmony
  | { kind: 'remove-harmony' }
  | { kind: 'counter' };                                      // needs instant speed (not built yet)

// ─── Musician & Instrument ──────────────────────────────────────────────────
// Abilities are display-only for now.
export interface MusicianCard {
  id: string;
  name: string;
  subtitle: string;
  hp: number;              // starting life
  abilityText: string;
  abilityType: 'active' | 'passive';
  artGradient: string;
}

export interface InstrumentCard {
  id: string;
  name: string;
  subtype: string;
  allowedKey: string;
  allowedNotes: string[];  // the scale: 4 copies of each form the note reserve
  abilityText: string;
  abilityType: 'active' | 'passive';
  artGradient: string;
}

// ─── Battle State ───────────────────────────────────────────────────────────
export type Side = 'player' | 'ai';

export interface Attachment {
  card: ChordSpellCard;    // goes to the discard when the attachment leaves
  power: number;
  spellproof: boolean;
}

export interface FieldSpirit {
  instanceId: string;
  card: SpiritCard;
  damage: number;            // cleared at the end of each turn
  tempPower: number;         // until-end-of-turn changes
  harmony: number;           // printed Harmony tokens left
  attachments: Attachment[]; // each one also counts as a Harmony
  isTapped: boolean;
  enteredThisTurn: boolean;  // can't attack yet unless it has Tempo
}

export interface PlayerState {
  id: Side;
  musician: MusicianCard;
  instrument: InstrumentCard;
  hp: number;
  maxHp: number;

  deck: AnyCard[];
  hand: AnyCard[];
  graveyard: AnyCard[];

  // Notes: reserve → (up to 3 per turn) → pool. Paying taps pool notes until your next turn.
  reserve: NoteCounts;
  pool: NoteCounts;        // untapped
  tappedPool: NoteCounts;
  notesAddedThisTurn: number;

  lanes: (FieldSpirit | null)[];  // LANE_COUNT slots, lane i faces the opponent's lane i
  movedThisTurn: boolean;
  songSpiritCast: boolean;        // song spirits are once per game
  mulliganDone: boolean;
}

export interface GameState {
  phase: 'mulligan' | 'playing' | 'game-over';
  currentPlayer: Side;
  firstPlayer: Side;
  turnNumber: number;
  player: PlayerState;
  ai: PlayerState;
  winner?: Side;
  log: string[];

  // UI selection state
  selectedHandIndex: number | null;
  selectedSpiritId: string | null;  // own spirit picked to attack or move
}

// ─── Game Actions ────────────────────────────────────────────────────────────
export type SpellTarget =
  | { kind: 'spirit'; instanceId: string }
  | { kind: 'player'; side: Side };

export type SpellPayment =
  | { kind: 'notes' }
  | { kind: 'spirit'; instanceId: string };  // tap a matching chord spirit

export type GameAction =
  | { type: 'KEEP_HAND'; who: Side }
  | { type: 'MULLIGAN'; who: Side }
  | { type: 'ADD_NOTE'; who: Side; noteId: NoteId }
  | { type: 'CAST_SPIRIT'; who: Side; cardId: string; lane: number }
  | { type: 'CAST_SPELL'; who: Side; cardId: string; target: SpellTarget; payment: SpellPayment }
  | { type: 'MOVE_SPIRIT'; who: Side; instanceId: string; lane: number }
  | { type: 'ATTACK'; who: Side; instanceId: string }
  | { type: 'END_TURN'; who: Side }
  | { type: 'SELECT_HAND_CARD'; index: number | null }
  | { type: 'SELECT_SPIRIT'; instanceId: string | null };

// ─── Collection ──────────────────────────────────────────────────────────────
export interface Collection {
  cardCounts: Record<string, number>;  // cardId → copies owned
  unlockedMusicians: string[];
  unlockedInstruments: string[];
}

// ─── Loadout ──────────────────────────────────────────────────────────────────
export interface Loadout {
  musicianId: string;
  instrumentId: string;
  deckCardIds: string[];  // ordered list of card IDs in deck
}
