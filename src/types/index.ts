// ─── Note Spirits ───────────────────────────────────────────────────────────
export type NoteId = 'C' | 'Cs' | 'D' | 'Ds' | 'E' | 'F' | 'Fs' | 'G' | 'Gs' | 'A' | 'As' | 'B';

export interface NoteSpiritDef {
  id: NoteId;
  displayName: string;   // "C#/Db"
  primaryNote: string;   // "C#"
  altNote: string;       // "Db"
  semitone: number;      // 0–11
  frequency: number;     // Hz (C4 octave)
  color: string;         // CSS color for UI
  strength: number;
  will: number;
}

// ─── Cards ──────────────────────────────────────────────────────────────────
export type CardType = 'chord-spirit' | 'song-spell' | 'chord-progression';

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  key: string;           // "C major"
  romanNumeral: string;  // "I", "ii", "iii"...
  requiredNotes: string[];  // e.g. ['C','E','G']
  abilityText: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  artGradient: string;   // CSS gradient for placeholder art
}

export interface ChordSpiritCard extends BaseCard {
  type: 'chord-spirit';
  chordName: string;     // "C Major", "D Minor"
  strength: number;
  will: number;
  keywords: Keyword[];
}

export interface SongSpellCard extends BaseCard {
  type: 'song-spell';
  effect: SpellEffect;
}

export interface ChordProgressionCard extends BaseCard {
  type: 'chord-progression';
  requiredChordIds: string[]; // card IDs of chord spirits needed on field
  isMinion: boolean;
  strength?: number;
  will?: number;
  keywords?: Keyword[];
  effect?: SpellEffect;   // if isMinion=false, this fires instead
}

export type AnyCard = ChordSpiritCard | SongSpellCard | ChordProgressionCard;

export type Keyword = 'Tempo' | 'Transfer' | 'Taunt' | 'Resonance';

export type SpellEffect =
  | { kind: 'stat-buff';  stat: 'strength' | 'will'; amount: number; target: EffectTarget }
  | { kind: 'stat-debuff'; stat: 'strength' | 'will'; amount: number; target: EffectTarget }
  | { kind: 'draw'; amount: number }
  | { kind: 'search'; cardType: CardType }
  | { kind: 'heal'; amount: number; target: EffectTarget }
  | { kind: 'damage'; amount: number; target: EffectTarget };

export type EffectTarget = 'any-spirit' | 'friendly-spirit' | 'enemy-spirit' | 'enemy-hero' | 'friendly-hero' | 'all-friendly' | 'all-enemy';

// ─── Musician & Instrument ──────────────────────────────────────────────────
export interface MusicianCard {
  id: string;
  name: string;
  subtitle: string;
  hp: number;
  abilityText: string;
  abilityType: 'active' | 'passive';
  abilityEffect?: SpellEffect;
  artGradient: string;
}

export interface InstrumentCard {
  id: string;
  name: string;
  subtype: string;
  allowedKey: string;
  allowedNotes: string[];  // notes the player's deck may use
  abilityText: string;
  abilityType: 'active' | 'passive';
  abilityEffect?: SpellEffect;
  artGradient: string;
}

// ─── Battle State ───────────────────────────────────────────────────────────
export interface FieldSpirit {
  instanceId: string;
  card: ChordSpiritCard | ChordProgressionCard;
  currentStrength: number;
  currentWill: number;
  canChallenge: boolean;   // false = summoning sickness
  isExhausted: boolean;
  hasTaunt: boolean;
  tempBuffs: TempBuff[];
}

export interface TempBuff {
  stat: 'strength' | 'will';
  amount: number;
  expiresAfterTurn: number;
}

export interface NoteOnField {
  instanceId: string;
  noteId: NoteId;
  chosenNote: string;  // 'C' or 'B#' (chosen variant)
  semitone: number;
}

export interface PlayerState {
  id: 'player' | 'ai';
  musician: MusicianCard;
  instrument: InstrumentCard;
  hp: number;
  maxHp: number;

  // Main deck
  deck: AnyCard[];
  hand: AnyCard[];
  graveyard: AnyCard[];

  // Note field
  noteField: NoteOnField[];
  playedNoteThisTurn: boolean;

  // Chord field
  chordField: FieldSpirit[];
}

export type TurnPhase = 'draw' | 'main' | 'attack' | 'end';

export interface GameState {
  phase: 'playing' | 'game-over';
  currentPlayer: 'player' | 'ai';
  turnPhase: TurnPhase;
  turnNumber: number;
  player: PlayerState;
  ai: PlayerState;
  winner?: 'player' | 'ai';
  log: string[];

  // UI selection state
  selectedNoteId: NoteId | null;
  selectedHandCardId: string | null;
  selectedAttackerInstanceId: string | null;
  pendingTargetFor: 'attack' | 'spell' | null;
}

// ─── Game Actions ────────────────────────────────────────────────────────────
export type GameAction =
  | { type: 'DRAW_CARD'; who: 'player' | 'ai' }
  | { type: 'PLAY_NOTE'; who: 'player' | 'ai'; noteId: NoteId; chosenNote: string }
  | { type: 'PLAY_CARD'; who: 'player' | 'ai'; cardId: string; targetInstanceId?: string }
  | { type: 'DECLARE_ATTACK'; who: 'player' | 'ai'; attackerInstanceId: string; targetInstanceId: string | 'hero' }
  | { type: 'END_TURN'; who: 'player' | 'ai' }
  | { type: 'SELECT_NOTE'; noteId: NoteId | null }
  | { type: 'SELECT_HAND_CARD'; cardId: string | null }
  | { type: 'SELECT_ATTACKER'; instanceId: string | null }
  | { type: 'DISMISS_LOG' };

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
