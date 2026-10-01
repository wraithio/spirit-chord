import type {
  ChordSpellCard, ChordSpiritCard, FieldSpirit, GameAction, GameState, NoteId, SpellPayment, SpellTarget,
} from '@/types';
import { noteIdOf } from './musicTheory';
import { gameReducer } from './gameEngine';
import {
  LANE_COUNT, canAttack, castLanes, currentPower, harmonyOf, isSpellproof, songSpiritMaterials, spellPaymentOptions,
  spellTargets, spiritsOf,
} from './rules';

// ─── AI Decision Engine ───────────────────────────────────────────────────────
// Rule-based AI. GameBoard calls getAIAction after every state change, so each decision sees
// the live board. Priority: add notes → Sun Dragon → chord spirits → spells → move → attack → end turn.
// Every candidate is checked against the real reducer, so the AI only ever returns legal actions.

const AI = 'ai' as const;

function isLegal(state: GameState, action: GameAction): boolean {
  return gameReducer(state, action) !== state;
}

export function getAIMulligan(state: GameState): GameAction {
  const hasSpirit = state.ai.hand.some(c => c.type === 'chord-spirit');
  return { type: hasSpirit ? 'KEEP_HAND' : 'MULLIGAN', who: AI };
}

export function getAIAction(state: GameState): GameAction {
  const candidates = [chooseNote, castSongSpirit, castChordSpirit, castSpell, moveSpirit, attack];
  for (const choose of candidates) {
    const action = choose(state);
    if (action && isLegal(state, action)) return action;
  }
  return { type: 'END_TURN', who: AI };
}

// ─── Notes ────────────────────────────────────────────────────────────────────
// Build toward one card at a time: the chord spirit (then spell) closest to castable from the
// untapped pool. Otherwise add whatever notes the hand is missing most.
function chooseNote(state: GameState): GameAction | null {
  const ai = state.ai;
  const inReserve = (Object.keys(ai.reserve) as NoteId[]).filter(id => (ai.reserve[id] ?? 0) > 0);
  if (ai.notesAddedThisTurn >= 3 || inReserve.length === 0) return null;

  const missingFor = (notes: string[]): NoteId[] => {
    const available = { ...ai.pool };
    const missing: NoteId[] = [];
    for (const note of notes) {
      const id = noteIdOf(note);
      if (!id) continue;
      if ((available[id] ?? 0) > 0) available[id] = available[id]! - 1;
      else missing.push(id);
    }
    return missing;
  };
  const goals = ai.hand
    .filter((c): c is ChordSpiritCard | ChordSpellCard => c.type !== 'song-spirit')
    .map(c => ({ card: c, missing: missingFor(c.requiredNotes) }))
    .filter(g => g.missing.length > 0 && g.missing.every(id => (ai.reserve[id] ?? 0) > 0))
    .sort((a, b) => a.missing.length - b.missing.length
      || (a.card.type === 'chord-spirit' ? -1 : 0) - (b.card.type === 'chord-spirit' ? -1 : 0));
  if (goals[0]) return { type: 'ADD_NOTE', who: AI, noteId: goals[0].missing[0] };

  const owned = (id: NoteId) => (ai.pool[id] ?? 0) + (ai.tappedPool[id] ?? 0);
  const need: Partial<Record<NoteId, number>> = {};
  for (const card of ai.hand) {
    if (card.type === 'song-spirit') continue;
    const weight = card.type === 'chord-spirit' ? 3 : 1;
    for (const note of card.requiredNotes) {
      const id = noteIdOf(note);
      if (id && owned(id) < 2) need[id] = (need[id] ?? 0) + weight;
    }
  }
  const ranked = [...inReserve].sort((a, b) => (need[b] ?? 0) - (need[a] ?? 0) || owned(a) - owned(b));
  return { type: 'ADD_NOTE', who: AI, noteId: ranked[0] };
}

// ─── Spirits ──────────────────────────────────────────────────────────────────
// How good a lane is for a spirit of this Power (higher is better)
function laneScore(state: GameState, lane: number, power: number, harmony: number): number {
  const enemy = state.player.lanes[lane];
  if (!enemy) return 3;                       // open lane: hits the player
  if (harmonyOf(enemy) > 0) return 1;         // can strip Harmony for free
  const enemyPower = currentPower(state.player, enemy);
  if (power > enemyPower) return 4;           // wins the clash
  if (power === enemyPower) return 1;         // trade
  return harmony > 0 ? 2 : -1;                // loses, unless we have Harmony to absorb it
}

function bestLane(state: GameState, lanes: number[], power: number, harmony: number): number {
  return [...lanes].sort((a, b) => laneScore(state, b, power, harmony) - laneScore(state, a, power, harmony))[0];
}

function castSongSpirit(state: GameState): GameAction | null {
  for (const card of state.ai.hand) {
    if (card.type !== 'song-spirit') continue;
    const lanes = castLanes(state, AI, card);
    if (lanes.length > 0) return { type: 'CAST_SPIRIT', who: AI, cardId: card.id, lane: bestLane(state, lanes, card.power, card.harmony) };
  }
  return null;
}

function castChordSpirit(state: GameState): GameAction | null {
  const onBoard = new Set(spiritsOf(state.ai).map(sp => sp.card.id));
  const ownsSongSpirit = state.ai.hand.some(c => c.type === 'song-spirit') && !state.ai.songSpiritCast;
  const value = (c: ChordSpiritCard) =>
    c.power + 2 * c.harmony + (c.keywords.includes('Tempo') ? 1 : 0) + (ownsSongSpirit && !onBoard.has(c.id) ? 3 : 0);

  const castable = state.ai.hand
    .filter((c): c is ChordSpiritCard => c.type === 'chord-spirit' && castLanes(state, AI, c).length > 0)
    .sort((a, b) => value(b) - value(a));
  const card = castable[0];
  if (!card) return null;
  return { type: 'CAST_SPIRIT', who: AI, cardId: card.id, lane: bestLane(state, castLanes(state, AI, card), card.power, card.harmony) };
}

// ─── Spells ───────────────────────────────────────────────────────────────────
// Pay with notes when possible; otherwise only tap a spirit that couldn't attack this turn anyway
function choosePayment(state: GameState, card: ChordSpellCard): SpellPayment | null {
  const options = spellPaymentOptions(state, AI, card);
  const notes = options.find(p => p.kind === 'notes');
  if (notes) return notes;
  return options.find(p => {
    if (p.kind !== 'spirit') return false;
    const sp = spiritsOf(state.ai).find(s => s.instanceId === p.instanceId);
    return sp !== undefined && !canAttack(state, AI, sp);
  }) ?? null;
}

const asTarget = (sp: FieldSpirit): SpellTarget => ({ kind: 'spirit', instanceId: sp.instanceId });

function chooseSpellTarget(state: GameState, card: ChordSpellCard): SpellTarget | null {
  const legal = spellTargets(state, card);
  const targetable = (sp: FieldSpirit) => legal.some(t => t.kind === 'spirit' && t.instanceId === sp.instanceId);
  const enemies = spiritsOf(state.player).filter(targetable);
  const mine = spiritsOf(state.ai).filter(targetable);
  const enemyPower = (sp: FieldSpirit) => currentPower(state.player, sp);
  const myPower = (sp: FieldSpirit) => currentPower(state.ai, sp);
  const strongestFirst = (list: FieldSpirit[], power: (sp: FieldSpirit) => number) => [...list].sort((a, b) => power(b) - power(a));
  const effect = card.effect;

  switch (effect.kind) {
    case 'damage': {
      const killable = strongestFirst(enemies.filter(sp => enemyPower(sp) <= effect.amount), enemyPower)[0];
      if (killable) return asTarget(killable);
      return effect.canTargetPlayers ? { kind: 'player', side: 'player' } : null;
    }
    case 'power': {
      if (effect.amount < 0) {
        const killable = strongestFirst(enemies.filter(sp => enemyPower(sp) <= -effect.amount), enemyPower)[0];
        return killable ? asTarget(killable) : null;
      }
      // Pump an attacker so it wins a clash it would otherwise lose or trade
      const attacker = mine.find(sp => {
        const enemy = state.player.lanes[state.ai.lanes.indexOf(sp)];
        if (!canAttack(state, AI, sp) || !enemy || harmonyOf(enemy) > 0) return false;
        return myPower(sp) <= enemyPower(enemy) && myPower(sp) + effect.amount > enemyPower(enemy);
      });
      return attacker ? asTarget(attacker) : null;
    }
    case 'attach': {
      // Protect our strongest spirit that has nothing protecting it yet
      const unprotected = mine.filter(sp => harmonyOf(sp) === 0 && !(effect.spellproof && isSpellproof(sp)));
      const best = strongestFirst(unprotected, myPower)[0];
      return best ? asTarget(best) : null;
    }
    case 'remove-harmony': {
      // Strip Harmony from an enemy that one of our ready attackers is facing
      const blocked = enemies.find(sp => {
        const facing = state.ai.lanes[state.player.lanes.indexOf(sp)];
        return harmonyOf(sp) > 0 && facing !== null && canAttack(state, AI, facing);
      });
      return blocked ? asTarget(blocked) : null;
    }
    case 'counter':
      return null;
  }
}

function castSpell(state: GameState): GameAction | null {
  for (const card of state.ai.hand) {
    if (card.type !== 'chord-spell') continue;
    const payment = choosePayment(state, card);
    const target = payment && chooseSpellTarget(state, card);
    if (payment && target) return { type: 'CAST_SPELL', who: AI, cardId: card.id, target, payment };
  }
  return null;
}

// ─── Movement & attacks ───────────────────────────────────────────────────────
function moveSpirit(state: GameState): GameAction | null {
  if (state.ai.movedThisTurn) return null;
  const emptyLanes = [...Array(LANE_COUNT).keys()].filter(l => state.ai.lanes[l] === null);
  for (const sp of spiritsOf(state.ai)) {
    if (!canAttack(state, AI, sp)) continue;
    const power = currentPower(state.ai, sp);
    const here = laneScore(state, state.ai.lanes.indexOf(sp), power, 0);
    const target = emptyLanes.find(l => laneScore(state, l, power, 0) > Math.max(here, 1));
    if (target !== undefined) return { type: 'MOVE_SPIRIT', who: AI, instanceId: sp.instanceId, lane: target };
  }
  return null;
}

function attack(state: GameState): GameAction | null {
  for (const sp of spiritsOf(state.ai)) {
    if (!canAttack(state, AI, sp)) continue;
    const enemy = state.player.lanes[state.ai.lanes.indexOf(sp)];
    const worthIt = !enemy                                                   // open lane: hit the player
      || harmonyOf(enemy) > 0                                                // strip Harmony for free
      || currentPower(state.ai, sp) > currentPower(state.player, enemy)       // win the clash
      || (currentPower(state.ai, sp) === currentPower(state.player, enemy)    // even trade
        && enemy.card.power >= sp.card.power && sp.card.type !== 'song-spirit');
    if (worthIt) return { type: 'ATTACK', who: AI, instanceId: sp.instanceId };
  }
  return null;
}
