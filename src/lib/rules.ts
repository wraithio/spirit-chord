import type {
  AnyCard, ChordSpellCard, ChordSpiritCard, FieldSpirit, GameState, InstrumentCard, NoteCounts, NoteId,
  PlayerState, Side, SongSpiritCard, SpellPayment, SpellTarget,
} from '@/types';
import { noteIdOf, samePitchClasses } from './musicTheory';

// Pure rule queries shared by the reducer, the AI and the UI. Rules: docs/rules.md

export const LANE_COUNT = 4;
export const NOTES_PER_TURN = 3;
export const NOTE_COPIES = 4;
export const STARTING_HAND = 6;
export const DECK_MIN = 40;
export const DECK_MAX = 60;

export const opponentOf = (side: Side): Side => (side === 'player' ? 'ai' : 'player');

export function isMyTurn(state: GameState, who: Side): boolean {
  return state.phase === 'playing' && state.currentPlayer === who;
}

// ─── Notes ────────────────────────────────────────────────────────────────────
export function buildReserve(instrument: InstrumentCard): NoteCounts {
  const reserve: NoteCounts = {};
  for (const note of instrument.allowedNotes) {
    const id = noteIdOf(note);
    if (id) reserve[id] = NOTE_COPIES;
  }
  return reserve;
}

export function totalNotes(counts: NoteCounts): number {
  return Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
}

function noteCost(requiredNotes: string[]): NoteCounts {
  const cost: NoteCounts = {};
  for (const note of requiredNotes) {
    const id = noteIdOf(note);
    if (id) cost[id] = (cost[id] ?? 0) + 1;
  }
  return cost;
}

export function canPayNotes(ps: PlayerState, requiredNotes: string[]): boolean {
  return Object.entries(noteCost(requiredNotes)).every(([id, n]) => (ps.pool[id as NoteId] ?? 0) >= (n ?? 0));
}

// Tap the matching untapped notes (caller checks canPayNotes first)
export function payNotes(ps: PlayerState, requiredNotes: string[]): PlayerState {
  const pool = { ...ps.pool };
  const tappedPool = { ...ps.tappedPool };
  for (const [id, n] of Object.entries(noteCost(requiredNotes)) as [NoteId, number][]) {
    pool[id] = (pool[id] ?? 0) - n;
    tappedPool[id] = (tappedPool[id] ?? 0) + n;
  }
  return { ...ps, pool, tappedPool };
}

export function canAddNote(state: GameState, who: Side, noteId: NoteId): boolean {
  const ps = state[who];
  return isMyTurn(state, who) && ps.notesAddedThisTurn < NOTES_PER_TURN && (ps.reserve[noteId] ?? 0) > 0;
}

// ─── Spirits ──────────────────────────────────────────────────────────────────
export function spiritsOf(ps: PlayerState): FieldSpirit[] {
  return ps.lanes.filter((sp): sp is FieldSpirit => sp !== null);
}

export function laneOf(ps: PlayerState, instanceId: string): number {
  return ps.lanes.findIndex(sp => sp?.instanceId === instanceId);
}

export function findSpirit(state: GameState, instanceId: string): { side: Side; lane: number; spirit: FieldSpirit } | null {
  for (const side of ['player', 'ai'] as const) {
    const lane = laneOf(state[side], instanceId);
    if (lane !== -1) return { side, lane, spirit: state[side].lanes[lane]! };
  }
  return null;
}

export function harmonyOf(sp: FieldSpirit): number {
  return sp.harmony + sp.attachments.length;
}

export function isSpellproof(sp: FieldSpirit): boolean {
  return sp.card.keywords.includes('Spellproof') || sp.attachments.some(a => a.spellproof);
}

export function hasTempo(sp: FieldSpirit): boolean {
  return sp.card.keywords.includes('Tempo');
}

// Printed Power + auras from your other spirits + attachments + until-end-of-turn changes − damage
export function currentPower(ps: PlayerState, sp: FieldSpirit): number {
  const aura = spiritsOf(ps)
    .filter(other => other.instanceId !== sp.instanceId && other.card.type === 'song-spirit')
    .reduce((sum, other) => sum + (other.card as SongSpiritCard).auraPower, 0);
  const attached = sp.attachments.reduce((sum, a) => sum + a.power, 0);
  return sp.card.power + aura + attached + sp.tempPower - sp.damage;
}

export function canAttack(state: GameState, who: Side, sp: FieldSpirit): boolean {
  return isMyTurn(state, who) && laneOf(state[who], sp.instanceId) !== -1
    && !sp.isTapped && (!sp.enteredThisTurn || hasTempo(sp));
}

export function canMove(state: GameState, who: Side, sp: FieldSpirit, lane: number): boolean {
  const ps = state[who];
  const from = laneOf(ps, sp.instanceId);
  return isMyTurn(state, who) && !ps.movedThisTurn && from !== -1 && from !== lane
    && lane >= 0 && lane < LANE_COUNT && ps.lanes[lane] === null;
}

// ─── Casting spirits ──────────────────────────────────────────────────────────
// The untapped chord spirits on your board that a song spirit would consume, or null if any is missing
export function songSpiritMaterials(ps: PlayerState, card: SongSpiritCard): FieldSpirit[] | null {
  const available = spiritsOf(ps).filter(sp => !sp.isTapped);
  const used: FieldSpirit[] = [];
  for (const reqId of card.requiredChordIds) {
    const match = available.find(sp => sp.card.id === reqId && !used.includes(sp));
    if (!match) return null;
    used.push(match);
  }
  return used;
}

// Lanes a spirit card can be cast into right now (empty lanes, plus lanes its materials free up)
export function castLanes(state: GameState, who: Side, card: ChordSpiritCard | SongSpiritCard): number[] {
  const ps = state[who];
  if (!isMyTurn(state, who) || !ps.hand.includes(card)) return [];
  const lanes = [...Array(LANE_COUNT).keys()];
  if (card.type === 'chord-spirit') {
    if (!canPayNotes(ps, card.requiredNotes)) return [];
    return lanes.filter(l => ps.lanes[l] === null);
  }
  if (ps.songSpiritCast) return [];
  const materials = songSpiritMaterials(ps, card);
  if (!materials) return [];
  return lanes.filter(l => ps.lanes[l] === null || materials.includes(ps.lanes[l]!));
}

// ─── Casting spells ───────────────────────────────────────────────────────────
// Spells are cast on your own turn for now; instant speed is planned (docs/rules.md §16)
export function spellPaymentOptions(state: GameState, who: Side, card: ChordSpellCard): SpellPayment[] {
  const ps = state[who];
  if (!isMyTurn(state, who)) return [];
  const options: SpellPayment[] = [];
  if (canPayNotes(ps, card.requiredNotes)) options.push({ kind: 'notes' });
  for (const sp of spiritsOf(ps)) {
    if (!sp.isTapped && sp.card.type === 'chord-spirit' && samePitchClasses(sp.card.requiredNotes, card.requiredNotes)) {
      options.push({ kind: 'spirit', instanceId: sp.instanceId });
    }
  }
  return options;
}

export function spellTargets(state: GameState, card: ChordSpellCard): SpellTarget[] {
  if (card.effect.kind === 'counter') return [];  // needs a spell to respond to
  const targets: SpellTarget[] = [];
  for (const side of ['player', 'ai'] as const) {
    for (const sp of spiritsOf(state[side])) {
      if (!isSpellproof(sp)) targets.push({ kind: 'spirit', instanceId: sp.instanceId });
    }
  }
  if (card.effect.kind === 'damage' && card.effect.canTargetPlayers) {
    targets.push({ kind: 'player', side: 'player' }, { kind: 'player', side: 'ai' });
  }
  return targets;
}

export function sameTarget(a: SpellTarget, b: SpellTarget): boolean {
  return a.kind === 'spirit' ? b.kind === 'spirit' && a.instanceId === b.instanceId
    : b.kind === 'player' && a.side === b.side;
}

export function samePayment(a: SpellPayment, b: SpellPayment): boolean {
  return a.kind === 'notes' ? b.kind === 'notes' : b.kind === 'spirit' && a.instanceId === b.instanceId;
}

export function canCastSpell(state: GameState, who: Side, card: ChordSpellCard): boolean {
  return state[who].hand.includes(card)
    && spellPaymentOptions(state, who, card).length > 0
    && spellTargets(state, card).length > 0;
}

export function canPlayCard(state: GameState, who: Side, card: AnyCard): boolean {
  return card.type === 'chord-spell' ? canCastSpell(state, who, card) : castLanes(state, who, card).length > 0;
}
