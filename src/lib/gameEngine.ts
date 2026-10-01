import type {
  AnyCard, ChordSpellCard, FieldSpirit, GameAction, GameState, InstrumentCard, MusicianCard, NoteCounts,
  PlayerState, Side, SpellTarget, SpiritCard,
} from '@/types';
import { NOTE_MAP } from './musicTheory';
import {
  LANE_COUNT, STARTING_HAND, buildReserve, canAddNote, canAttack, canMove, castLanes, currentPower, findSpirit,
  harmonyOf, isMyTurn, laneOf, opponentOf, payNotes, sameTarget, samePayment, songSpiritMaterials,
  spellPaymentOptions, spellTargets,
} from './rules';

// Rules: docs/rules.md. Legality checks live in ./rules so the AI and UI can share them.

let instanceCounter = 0;
export function newInstanceId(prefix: string): string {
  return `${prefix}-${++instanceCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Shuffle ──────────────────────────────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sideName = (side: Side) => (side === 'player' ? 'Player' : 'AI');

function addLog(state: GameState, msg: string): GameState {
  return { ...state, log: [...state.log.slice(-39), msg] };
}

// ─── Create Player State ──────────────────────────────────────────────────────
export function createPlayerState(
  id: Side,
  musician: MusicianCard,
  instrument: InstrumentCard,
  deckCards: AnyCard[]
): PlayerState {
  const shuffled = shuffle(deckCards);
  return {
    id,
    musician,
    instrument,
    hp: musician.hp,
    maxHp: musician.hp,
    deck: shuffled.slice(STARTING_HAND),
    hand: shuffled.slice(0, STARTING_HAND),
    graveyard: [],
    reserve: buildReserve(instrument),
    pool: {},
    tappedPool: {},
    notesAddedThisTurn: 0,
    lanes: Array(LANE_COUNT).fill(null),
    movedThisTurn: false,
    songSpiritCast: false,
    mulliganDone: false,
  };
}

function makeFieldSpirit(card: SpiritCard): FieldSpirit {
  return {
    instanceId: newInstanceId(card.id),
    card,
    damage: 0,
    tempPower: 0,
    harmony: card.harmony,
    attachments: [],
    isTapped: false,
    enteredThisTurn: true,
  };
}

// ─── Small state updaters ─────────────────────────────────────────────────────
function updateSpirit(ps: PlayerState, instanceId: string, fn: (sp: FieldSpirit) => FieldSpirit): PlayerState {
  return { ...ps, lanes: ps.lanes.map(sp => (sp?.instanceId === instanceId ? fn(sp) : sp)) };
}

// Leaving the field sends the spirit and anything attached to it to the discard
function removeSpirit(ps: PlayerState, instanceId: string): PlayerState {
  const sp = ps.lanes.find(s => s?.instanceId === instanceId);
  if (!sp) return ps;
  return {
    ...ps,
    lanes: ps.lanes.map(s => (s?.instanceId === instanceId ? null : s)),
    graveyard: [...ps.graveyard, sp.card, ...sp.attachments.map(a => a.card)],
  };
}

function removeFromHand(ps: PlayerState, cardId: string): PlayerState {
  const idx = ps.hand.findIndex(c => c.id === cardId);
  return idx === -1 ? ps : { ...ps, hand: ps.hand.filter((_, i) => i !== idx) };
}

// Strip one Harmony: printed tokens first, then the newest attachment (which goes to the discard)
function stripHarmony(ps: PlayerState, instanceId: string): PlayerState {
  const sp = ps.lanes.find(s => s?.instanceId === instanceId);
  if (!sp) return ps;
  if (sp.harmony > 0) return updateSpirit(ps, instanceId, s => ({ ...s, harmony: s.harmony - 1 }));
  const removed = sp.attachments[sp.attachments.length - 1];
  if (!removed) return ps;
  return {
    ...updateSpirit(ps, instanceId, s => ({ ...s, attachments: s.attachments.slice(0, -1) })),
    graveyard: [...ps.graveyard, removed.card],
  };
}

function drawCard(ps: PlayerState): PlayerState {
  if (ps.deck.length === 0) return ps;  // no deck-out loss: just skip the draw
  const [drawn, ...rest] = ps.deck;
  return { ...ps, deck: rest, hand: [...ps.hand, drawn] };
}

function mergeCounts(a: NoteCounts, b: NoteCounts): NoteCounts {
  const out: NoteCounts = { ...a };
  for (const [id, n] of Object.entries(b) as [keyof NoteCounts, number][]) out[id] = (out[id] ?? 0) + n;
  return out;
}

// ─── Turn flow ────────────────────────────────────────────────────────────────
// Untap, then draw (the first player skips their first draw)
function startTurn(state: GameState, who: Side, skipDraw: boolean): GameState {
  let ps: PlayerState = {
    ...state[who],
    pool: mergeCounts(state[who].pool, state[who].tappedPool),
    tappedPool: {},
    lanes: state[who].lanes.map(sp => (sp ? { ...sp, isTapped: false, enteredThisTurn: false } : sp)),
    notesAddedThisTurn: 0,
    movedThisTurn: false,
  };
  let s: GameState = { ...state, currentPlayer: who, selectedHandIndex: null, selectedSpiritId: null };
  s = addLog(s, `--- ${sideName(who)}'s turn ---`);
  if (!skipDraw) {
    if (ps.deck.length === 0) s = addLog(s, `${sideName(who)} has no cards left and skips the draw.`);
    ps = drawCard(ps);
  }
  return { ...s, [who]: ps };
}

// At the end of each turn, until-end-of-turn changes expire and damage on survivors clears
function endOfTurnCleanup(ps: PlayerState): PlayerState {
  return { ...ps, lanes: ps.lanes.map(sp => (sp ? { ...sp, tempPower: 0, damage: 0 } : sp)) };
}

// State-based checks after every action: spirits at 0 Power die (repeat, since losing an aura
// can drop others to 0), then a player at 0 life loses.
function resolveDeaths(state: GameState): GameState {
  let s = state;
  for (let guard = 0; guard < 10; guard++) {
    let changed = false;
    for (const side of ['player', 'ai'] as const) {
      const dead = s[side].lanes.filter((sp): sp is FieldSpirit => sp !== null && currentPower(s[side], sp) <= 0);
      for (const sp of dead) {
        s = { ...s, [side]: removeSpirit(s[side], sp.instanceId) };
        s = addLog(s, `${sp.card.name} (${sideName(side)}) is destroyed!`);
        changed = true;
      }
    }
    if (!changed) break;
  }
  if (s.phase !== 'game-over' && (s.player.hp <= 0 || s.ai.hp <= 0)) {
    const winner: Side = s.ai.hp <= 0 ? (s.player.hp <= 0 ? s.currentPlayer : 'player') : 'ai';
    s = addLog({ ...s, phase: 'game-over', winner, selectedHandIndex: null, selectedSpiritId: null }, `${sideName(winner)} wins!`);
  }
  return s;
}

// ─── Spells ───────────────────────────────────────────────────────────────────
function applySpell(state: GameState, who: Side, spell: ChordSpellCard, t: SpellTarget): GameState {
  let s = state;
  const effect = spell.effect;
  const discardSpell = (st: GameState) => ({ ...st, [who]: { ...st[who], graveyard: [...st[who].graveyard, spell] } });

  if (t.kind === 'player') {
    if (effect.kind === 'damage') {
      s = { ...s, [t.side]: { ...s[t.side], hp: s[t.side].hp - effect.amount } };
      s = addLog(s, `${spell.name} deals ${effect.amount} damage to ${sideName(t.side)}!`);
    }
    return discardSpell(s);
  }

  const found = findSpirit(s, t.instanceId);
  if (!found) return discardSpell(s);
  const { side, spirit } = found;
  const name = `${spirit.card.name} (${sideName(side)})`;

  switch (effect.kind) {
    case 'damage':
      s = { ...s, [side]: updateSpirit(s[side], spirit.instanceId, sp => ({ ...sp, damage: sp.damage + effect.amount })) };
      return discardSpell(addLog(s, `${spell.name} deals ${effect.amount} damage to ${name}.`));
    case 'power':
      s = { ...s, [side]: updateSpirit(s[side], spirit.instanceId, sp => ({ ...sp, tempPower: sp.tempPower + effect.amount })) };
      return discardSpell(addLog(s, `${spell.name}: ${name} gets ${effect.amount > 0 ? '+' : ''}${effect.amount} Power until end of turn.`));
    case 'attach':
      s = {
        ...s,
        [side]: updateSpirit(s[side], spirit.instanceId, sp => ({
          ...sp,
          attachments: [...sp.attachments, { card: spell, power: effect.power, spellproof: effect.spellproof }],
        })),
      };
      return addLog(s, `${spell.name} attaches to ${name}.`);
    case 'remove-harmony': {
      const attached = spirit.attachments.map(a => a.card);
      s = {
        ...s,
        [side]: {
          ...updateSpirit(s[side], spirit.instanceId, sp => ({ ...sp, harmony: 0, attachments: [] })),
          graveyard: [...s[side].graveyard, ...attached],
        },
      };
      return discardSpell(addLog(s, `${spell.name} removes all Harmony from ${name}.`));
    }
    case 'counter':
      return state;  // not castable until instant speed exists
  }
}

// ─── Combat ───────────────────────────────────────────────────────────────────
function resolveAttack(state: GameState, who: Side, attacker: FieldSpirit): GameState {
  const opp = opponentOf(who);
  const lane = laneOf(state[who], attacker.instanceId);
  let s: GameState = { ...state, [who]: updateSpirit(state[who], attacker.instanceId, sp => ({ ...sp, isTapped: true })) };
  const atkPower = currentPower(s[who], attacker);
  const defender = s[opp].lanes[lane];

  if (!defender) {
    s = { ...s, [opp]: { ...s[opp], hp: s[opp].hp - atkPower } };
    return addLog(s, `${attacker.card.name} attacks down lane ${lane + 1} and hits ${sideName(opp)} for ${atkPower}!`);
  }

  if (harmonyOf(defender) > 0) {
    s = { ...s, [opp]: stripHarmony(s[opp], defender.instanceId) };
    return addLog(s, `${defender.card.name}'s Harmony cancels ${attacker.card.name}'s attack.`);
  }

  // Power is both attack and health: both deal damage at the same time
  const defPower = currentPower(s[opp], defender);
  s = {
    ...s,
    [opp]: updateSpirit(s[opp], defender.instanceId, sp => ({ ...sp, damage: sp.damage + atkPower })),
    [who]: updateSpirit(s[who], attacker.instanceId, sp => ({ ...sp, damage: sp.damage + defPower })),
  };
  return addLog(s, `${attacker.card.name} (${atkPower}) clashes with ${defender.card.name} (${defPower}) in lane ${lane + 1}.`);
}

// ─── Main Reducer ─────────────────────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = reduce(state, action);
  return next === state ? state : resolveDeaths(next);
}

function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'KEEP_HAND':
    case 'MULLIGAN': {
      const { who } = action;
      const ps = state[who];
      if (state.phase !== 'mulligan' || ps.mulliganDone) return state;

      let updated: PlayerState = { ...ps, mulliganDone: true };
      if (action.type === 'MULLIGAN') {
        const reshuffled = shuffle([...ps.deck, ...ps.hand]);
        updated = { ...updated, hand: reshuffled.slice(0, ps.hand.length), deck: reshuffled.slice(ps.hand.length) };
      }
      let s = addLog({ ...state, [who]: updated }, `${sideName(who)} ${action.type === 'MULLIGAN' ? 'mulligans' : 'keeps their hand'}.`);
      if (s.player.mulliganDone && s.ai.mulliganDone) {
        s = startTurn({ ...s, phase: 'playing' }, s.firstPlayer, true);
      }
      return s;
    }

    case 'ADD_NOTE': {
      const { who, noteId } = action;
      if (!canAddNote(state, who, noteId)) return state;
      const ps = state[who];
      const updated: PlayerState = {
        ...ps,
        reserve: { ...ps.reserve, [noteId]: (ps.reserve[noteId] ?? 0) - 1 },
        pool: { ...ps.pool, [noteId]: (ps.pool[noteId] ?? 0) + 1 },
        notesAddedThisTurn: ps.notesAddedThisTurn + 1,
      };
      return addLog({ ...state, [who]: updated }, `${sideName(who)} adds ${NOTE_MAP[noteId].name} to their note pool.`);
    }

    case 'CAST_SPIRIT': {
      const { who, cardId, lane } = action;
      const ps = state[who];
      const card = ps.hand.find(c => c.id === cardId);
      if (!card || card.type === 'chord-spell' || !castLanes(state, who, card).includes(lane)) return state;

      let updated = removeFromHand(ps, cardId);
      if (card.type === 'chord-spirit') {
        updated = payNotes(updated, card.requiredNotes);
      } else {
        // Song spirit: the combined chord spirits leave the board
        for (const material of songSpiritMaterials(ps, card)!) updated = removeSpirit(updated, material.instanceId);
        updated = { ...updated, songSpiritCast: true };
      }
      updated = { ...updated, lanes: updated.lanes.map((sp, i) => (i === lane ? makeFieldSpirit(card) : sp)) };
      const verb = card.type === 'song-spirit' ? 'combines four chords into' : 'casts';
      return addLog(
        { ...state, [who]: updated, selectedHandIndex: null, selectedSpiritId: null },
        `${sideName(who)} ${verb} ${card.name} in lane ${lane + 1}.`,
      );
    }

    case 'CAST_SPELL': {
      const { who, cardId, target, payment } = action;
      const ps = state[who];
      const card = ps.hand.find((c): c is ChordSpellCard => c.id === cardId && c.type === 'chord-spell');
      if (!card) return state;
      if (!spellPaymentOptions(state, who, card).some(p => samePayment(p, payment))) return state;
      if (!spellTargets(state, card).some(t => sameTarget(t, target))) return state;

      let updated = removeFromHand(ps, cardId);
      updated = payment.kind === 'notes'
        ? payNotes(updated, card.requiredNotes)
        : updateSpirit(updated, payment.instanceId, sp => ({ ...sp, isTapped: true }));
      let s: GameState = { ...state, [who]: updated, selectedHandIndex: null, selectedSpiritId: null };
      const paidWith = payment.kind === 'notes' ? 'notes' : `tapping ${findSpirit(s, payment.instanceId)?.spirit.card.name}`;
      s = addLog(s, `${sideName(who)} casts ${card.name} (paid with ${paidWith}).`);
      return applySpell(s, who, card, target);
    }

    case 'MOVE_SPIRIT': {
      const { who, instanceId, lane } = action;
      const ps = state[who];
      const sp = ps.lanes.find(s => s?.instanceId === instanceId);
      if (!sp || !canMove(state, who, sp, lane)) return state;
      const updated: PlayerState = {
        ...ps,
        lanes: ps.lanes.map((s, i) => (i === lane ? sp : s?.instanceId === instanceId ? null : s)),
        movedThisTurn: true,
      };
      return addLog({ ...state, [who]: updated, selectedSpiritId: null }, `${sideName(who)} moves ${sp.card.name} to lane ${lane + 1}.`);
    }

    case 'ATTACK': {
      const { who, instanceId } = action;
      const sp = state[who].lanes.find(s => s?.instanceId === instanceId);
      if (!sp || !canAttack(state, who, sp)) return state;
      return resolveAttack({ ...state, selectedSpiritId: null }, who, sp);
    }

    case 'END_TURN': {
      const { who } = action;
      if (!isMyTurn(state, who)) return state;
      const opp = opponentOf(who);
      let s: GameState = { ...state, player: endOfTurnCleanup(state.player), ai: endOfTurnCleanup(state.ai) };
      s = { ...s, turnNumber: s.turnNumber + (who === s.firstPlayer ? 0 : 1) };
      return startTurn(s, opp, false);
    }

    case 'SELECT_HAND_CARD':
      return { ...state, selectedHandIndex: action.index, selectedSpiritId: null };

    case 'SELECT_SPIRIT':
      return { ...state, selectedSpiritId: action.instanceId, selectedHandIndex: null };

    default:
      return state;
  }
}

// ─── Initial state factory ────────────────────────────────────────────────────
export function createInitialState(
  playerMusician: MusicianCard,
  playerInstrument: InstrumentCard,
  playerDeck: AnyCard[],
  aiMusician: MusicianCard,
  aiInstrument: InstrumentCard,
  aiDeck: AnyCard[]
): GameState {
  const firstPlayer: Side = Math.random() < 0.5 ? 'player' : 'ai';
  return {
    phase: 'mulligan',
    currentPlayer: firstPlayer,
    firstPlayer,
    turnNumber: 1,
    player: createPlayerState('player', playerMusician, playerInstrument, playerDeck),
    ai: createPlayerState('ai', aiMusician, aiInstrument, aiDeck),
    log: [
      `Coin flip: ${firstPlayer === 'player' ? 'you go' : 'the AI goes'} first.`,
      'Keep your opening hand or mulligan once.',
    ],
    selectedHandIndex: null,
    selectedSpiritId: null,
  };
}
