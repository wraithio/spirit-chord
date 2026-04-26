import type {
  GameState, GameAction, PlayerState, FieldSpirit,
  NoteOnField, AnyCard, ChordSpiritCard, ChordProgressionCard,
  SongSpellCard, NoteId, MusicianCard, InstrumentCard,
} from '@/types';
import { canPlayCard } from './musicTheory';
import { NOTE_MAP } from './musicTheory';

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

// ─── Create Player State ──────────────────────────────────────────────────────
export function createPlayerState(
  id: 'player' | 'ai',
  musician: MusicianCard,
  instrument: InstrumentCard,
  deckCards: AnyCard[]
): PlayerState {
  const shuffled = shuffle(deckCards);
  const hand = shuffled.slice(0, 7);
  const deck = shuffled.slice(7);
  return {
    id,
    musician,
    instrument,
    hp: musician.hp,
    maxHp: musician.hp,
    deck,
    hand,
    graveyard: [],
    noteField: [],
    playedNoteThisTurn: false,
    chordField: [],
  };
}

// ─── Can play chord card check ────────────────────────────────────────────────
export function canAffordCard(card: AnyCard, noteField: NoteOnField[], chordField: FieldSpirit[]): boolean {
  if (card.type === 'chord-spirit' || card.type === 'song-spell') {
    const fieldNoteNames = noteField.map(n => n.chosenNote);
    return canPlayCard(card.requiredNotes, fieldNoteNames);
  }
  if (card.type === 'chord-progression') {
    const prog = card as ChordProgressionCard;
    const fieldCardIds = chordField.map(s => s.card.id);
    return prog.requiredChordIds.every(reqId => fieldCardIds.includes(reqId));
  }
  return false;
}

// ─── Draw card ────────────────────────────────────────────────────────────────
function drawCard(state: PlayerState, count: number = 1): PlayerState {
  let s = { ...state };
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) break;
    const [drawn, ...rest] = s.deck;
    s = { ...s, deck: rest, hand: [...s.hand, drawn] };
  }
  return s;
}

// ─── Apply note costs (remove notes from field) ───────────────────────────────
function consumeNotes(noteField: NoteOnField[], requiredNotes: string[]): NoteOnField[] {
  const remaining = [...noteField];
  for (const reqNote of requiredNotes) {
    const idx = remaining.findIndex(n =>
      n.chosenNote === reqNote ||
      NOTE_MAP[n.noteId]?.primaryNote === reqNote ||
      NOTE_MAP[n.noteId]?.altNote === reqNote
    );
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}

// ─── Create FieldSpirit from card ─────────────────────────────────────────────
function makeFieldSpirit(card: ChordSpiritCard | ChordProgressionCard): FieldSpirit {
  const hasKeywords = (card as ChordSpiritCard).keywords ?? (card as ChordProgressionCard).keywords ?? [];
  const hasTempo = hasKeywords.includes('Tempo');
  return {
    instanceId: newInstanceId(card.id),
    card,
    currentStrength: (card as ChordSpiritCard).strength ?? (card as ChordProgressionCard).strength ?? 0,
    currentWill: (card as ChordSpiritCard).will ?? (card as ChordProgressionCard).will ?? 0,
    canChallenge: hasTempo,
    isExhausted: false,
    hasTaunt: hasKeywords.includes('Taunt'),
    tempBuffs: [],
  };
}

// ─── Apply spell effect ───────────────────────────────────────────────────────
function applySpell(
  state: GameState,
  spell: SongSpellCard,
  who: 'player' | 'ai',
  targetInstanceId?: string
): GameState {
  const s = { ...state };
  const { effect } = spell;
  const opp = who === 'player' ? 'ai' : 'player';

  if (effect.kind === 'draw') {
    s[who] = drawCard(s[who], effect.amount);
    return addLog(s, `${spell.name}: drew ${effect.amount} card(s).`);
  }

  if (effect.kind === 'stat-buff' || effect.kind === 'stat-debuff') {
    const delta = effect.kind === 'stat-buff' ? effect.amount : -effect.amount;
    const target = effect.target;

    if (target === 'all-friendly') {
      s[who] = {
        ...s[who],
        chordField: s[who].chordField.map(sp => ({
          ...sp,
          currentStrength: effect.stat === 'strength' ? sp.currentStrength + delta : sp.currentStrength,
          currentWill: effect.stat === 'will' ? sp.currentWill + delta : sp.currentWill,
        })),
      };
      return addLog(s, `${spell.name}: all friendly spirits +${delta} ${effect.stat}.`);
    }

    if (target === 'all-enemy') {
      s[opp] = {
        ...s[opp],
        chordField: s[opp].chordField.map(sp => ({
          ...sp,
          currentStrength: effect.stat === 'strength' ? sp.currentStrength + delta : sp.currentStrength,
          currentWill: effect.stat === 'will' ? sp.currentWill + delta : sp.currentWill,
        })),
      };
      return addLog(s, `${spell.name}: all enemy spirits ${delta} ${effect.stat}.`);
    }

    // Target a specific spirit
    if (targetInstanceId) {
      for (const side of ['player', 'ai'] as const) {
        const idx = s[side].chordField.findIndex(sp => sp.instanceId === targetInstanceId);
        if (idx !== -1) {
          const updated = [...s[side].chordField];
          const sp = { ...updated[idx] };
          if (effect.stat === 'strength') sp.currentStrength += delta;
          if (effect.stat === 'will') sp.currentWill += delta;
          updated[idx] = sp;
          s[side] = { ...s[side], chordField: updated };
          // If will hits 0, remove
          if (sp.currentWill <= 0) {
            s[side] = {
              ...s[side],
              chordField: s[side].chordField.filter(x => x.instanceId !== targetInstanceId),
              graveyard: [...s[side].graveyard, sp.card],
            };
          }
          break;
        }
      }
    }
    return addLog(s, `${spell.name} applied!`);
  }

  if (effect.kind === 'damage' && targetInstanceId) {
    for (const side of ['player', 'ai'] as const) {
      const idx = s[side].chordField.findIndex(sp => sp.instanceId === targetInstanceId);
      if (idx !== -1) {
        const updated = [...s[side].chordField];
        const sp = { ...updated[idx], currentWill: updated[idx].currentWill - effect.amount };
        if (sp.currentWill <= 0) {
          s[side] = {
            ...s[side],
            chordField: updated.filter((_, i) => i !== idx),
            graveyard: [...s[side].graveyard, sp.card],
          };
        } else {
          updated[idx] = sp;
          s[side] = { ...s[side], chordField: updated };
        }
        return addLog(s, `${spell.name}: dealt ${effect.amount} damage!`);
      }
    }
  }

  return s;
}

function addLog(state: GameState, msg: string): GameState {
  return { ...state, log: [...state.log.slice(-19), msg] };
}

// ─── End-of-turn cleanup ──────────────────────────────────────────────────────
function endTurnCleanup(state: GameState, who: 'player' | 'ai'): GameState {
  const s = { ...state };

  // Expire temp buffs and reset spirits for next turn (un-exhaust, enable challenge)
  s[who] = {
    ...s[who],
    chordField: s[who].chordField.map(sp => ({
      ...sp,
      isExhausted: false,
      canChallenge: true, // spirits can now challenge next turn
    })),
    playedNoteThisTurn: false,
    noteField: s[who].noteField, // notes persist
  };

  return s;
}

// ─── Combat resolution ────────────────────────────────────────────────────────
function resolveAttack(
  state: GameState,
  who: 'player' | 'ai',
  attackerInstanceId: string,
  targetInstanceId: string | 'hero'
): GameState {
  let s = { ...state };
  const opp = who === 'player' ? 'ai' : 'player';

  const attackerIdx = s[who].chordField.findIndex(sp => sp.instanceId === attackerInstanceId);
  if (attackerIdx === -1) return s;
  const attacker = s[who].chordField[attackerIdx];

  if (!attacker.canChallenge || attacker.isExhausted) return s;

  // Mark attacker as exhausted
  const newAttackerField = [...s[who].chordField];
  newAttackerField[attackerIdx] = { ...attacker, isExhausted: true };
  s[who] = { ...s[who], chordField: newAttackerField };

  if (targetInstanceId === 'hero') {
    s[opp] = { ...s[opp], hp: s[opp].hp - attacker.currentStrength };
    s = addLog(s, `${attacker.card.name} attacks ${opp} hero for ${attacker.currentStrength} damage!`);
    if (s[opp].hp <= 0) {
      s = { ...s, phase: 'game-over', winner: who };
    }
    return s;
  }

  // Target is a spirit
  const defenderIdx = s[opp].chordField.findIndex(sp => sp.instanceId === targetInstanceId);
  if (defenderIdx === -1) return s;
  const defender = s[opp].chordField[defenderIdx];

  const atkStr = attacker.currentStrength;
  const defWill = defender.currentWill;
  const defStr = defender.currentStrength;
  const atkWill = attacker.currentWill;

  let newDefWill = defWill - atkStr;
  let newAtkWill = atkWill - defStr;

  s = addLog(s, `${attacker.card.name} (${atkStr}⚔) challenges ${defender.card.name} (${defStr}⚔ ${defWill}🛡)!`);

  // Transfer keyword (trample)
  const hasTransfer = (attacker.card as ChordSpiritCard).keywords?.includes('Transfer') ||
    (attacker.card as ChordProgressionCard).keywords?.includes('Transfer');
  if (hasTransfer && atkStr > defWill) {
    s[opp] = { ...s[opp], hp: s[opp].hp - (atkStr - defWill) };
    s = addLog(s, `Transfer! ${atkStr - defWill} excess damage to ${opp} hero!`);
  }

  // Fanfare Falcon debuff on damage
  if (attacker.card.id === 'chord-ii-Dmin' && atkStr > 0) {
    newDefWill -= 1;
    s = addLog(s, `Fanfare Falcon's ability: ${defender.card.name} loses 1 will!`);
  }

  // Remove destroyed spirits
  const oppField = s[opp].chordField.filter((_, i) => i !== defenderIdx);
  const ownField = s[who].chordField.filter((_, i) => i !== attackerIdx);

  if (newDefWill <= 0) {
    s[opp] = { ...s[opp], chordField: oppField, graveyard: [...s[opp].graveyard, defender.card] };
    s = addLog(s, `${defender.card.name} is defeated!`);
  } else {
    const updatedDef = { ...defender, currentWill: newDefWill };
    const updatedOppField = [...s[opp].chordField];
    updatedOppField[defenderIdx] = updatedDef;
    s[opp] = { ...s[opp], chordField: updatedOppField };
  }

  if (newAtkWill <= 0) {
    s[who] = { ...s[who], chordField: ownField, graveyard: [...s[who].graveyard, attacker.card] };
    s = addLog(s, `${attacker.card.name} is defeated in combat!`);
  } else {
    const newField = [...s[who].chordField];
    const idx2 = newField.findIndex(sp => sp.instanceId === attackerInstanceId);
    if (idx2 !== -1) newField[idx2] = { ...newField[idx2], currentWill: newAtkWill };
    s[who] = { ...s[who], chordField: newField };
  }

  // Aeolian Fox heal
  if (defender.card.id === 'chord-vi-Amin' && defStr > 0) {
    const healSide = opp === 'player' ? 'player' : 'ai';
    s[healSide] = { ...s[healSide], hp: Math.min(s[healSide].maxHp, s[healSide].hp + 1) };
    s = addLog(s, `Aeolian Fox restores 1 HP to ${healSide}!`);
  }

  // Flute Flies buff on survive
  if (attacker.card.id === 'chord-iii-Emin' && newAtkWill > 0) {
    const idx2 = s[who].chordField.findIndex(sp => sp.instanceId === attackerInstanceId);
    if (idx2 !== -1) {
      const f = [...s[who].chordField];
      f[idx2] = { ...f[idx2], currentWill: f[idx2].currentWill + 1 };
      s[who] = { ...s[who], chordField: f };
      s = addLog(s, `Flute Flies gains +1 will from surviving combat!`);
    }
  }

  if (s[opp].hp <= 0) {
    s = { ...s, phase: 'game-over', winner: who };
  }

  return s;
}

// ─── Main Reducer ─────────────────────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DRAW_CARD': {
      const s = { ...state };
      s[action.who] = drawCard(s[action.who]);
      return addLog(s, `${action.who} draws a card.`);
    }

    case 'PLAY_NOTE': {
      const { who, noteId, chosenNote } = action;
      const ps = state[who];
      if (ps.playedNoteThisTurn) return state;

      const noteOnField: NoteOnField = {
        instanceId: newInstanceId('note'),
        noteId,
        chosenNote,
        semitone: NOTE_MAP[noteId]?.semitone ?? 0,
      };

      const newState = {
        ...state,
        [who]: {
          ...ps,
          noteField: [...ps.noteField, noteOnField],
          playedNoteThisTurn: true,
        },
      };
      return addLog(newState, `${who} plays Note Spirit: ${chosenNote}`);
    }

    case 'PLAY_CARD': {
      const { who, cardId, targetInstanceId } = action;
      const ps = state[who];
      const cardIdx = ps.hand.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return state;
      const card = ps.hand[cardIdx];
      const newHand = ps.hand.filter((_, i) => i !== cardIdx);

      if (!canAffordCard(card, ps.noteField, ps.chordField)) return state;

      let s = { ...state };

      if (card.type === 'chord-spirit') {
        const cs = card as ChordSpiritCard;
        const remainingNotes = consumeNotes(ps.noteField, cs.requiredNotes);
        const spirit = makeFieldSpirit(cs);
        s[who] = {
          ...ps,
          hand: newHand,
          noteField: remainingNotes,
          chordField: [...ps.chordField, spirit],
        };
        s = addLog(s, `${who} plays ${cs.name} (${cs.chordName})!`);

        // Entry effects
        if (cs.id === 'chord-IV-Fmaj') {
          s[who] = drawCard(s[who]);
          s = addLog(s, `Subdominant Sage: draw 1 card.`);
        }
        if (cs.id === 'chord-vii-Bdim') {
          // Deal 1 damage to cheapest enemy spirit
          const targets = s[who === 'player' ? 'ai' : 'player'].chordField;
          if (targets.length > 0) {
            const t = targets.reduce((a, b) => a.currentWill < b.currentWill ? a : b);
            s = resolveAttack(s, who, spirit.instanceId, t.instanceId);
            // Actually just damage, not full combat — adjust
          }
        }
      } else if (card.type === 'song-spell') {
        const spell = card as SongSpellCard;
        const remainingNotes = consumeNotes(ps.noteField, spell.requiredNotes);
        s[who] = { ...ps, hand: newHand, noteField: remainingNotes, graveyard: [...ps.graveyard, card] };
        s = applySpell(s, spell, who, targetInstanceId);
      } else if (card.type === 'chord-progression') {
        const prog = card as ChordProgressionCard;
        // Consume required chord spirits from field
        const toConsume = prog.requiredChordIds;
        let newChordField = [...ps.chordField];
        const consumed: (ChordSpiritCard | ChordProgressionCard)[] = [];

        for (const reqId of toConsume) {
          const idx = newChordField.findIndex(sp => sp.card.id === reqId);
          if (idx !== -1) {
            consumed.push(newChordField[idx].card);
            newChordField.splice(idx, 1);
          }
        }

        if (prog.isMinion) {
          const spirit = makeFieldSpirit(prog);
          s[who] = {
            ...ps,
            hand: newHand,
            chordField: [...newChordField, spirit],
            graveyard: [...ps.graveyard, ...consumed],
          };
          s = addLog(s, `${who} unleashes Chord Progression: ${prog.name}!`);

          // Stallion search effect
          if (prog.id === 'prog-I-IV-stallion') {
            const chordCards = s[who].deck.filter(c => c.type === 'chord-spirit' || c.type === 'chord-progression');
            if (chordCards.length > 0) {
              const found = chordCards[0];
              s[who] = {
                ...s[who],
                deck: shuffle(s[who].deck.filter(c => c !== found)),
                hand: [...s[who].hand, found],
              };
              s = addLog(s, `Sustainin' Stallion: searched deck for ${found.name}!`);
            }
          }
        } else {
          // Spell progression
          s[who] = {
            ...ps,
            hand: newHand,
            chordField: newChordField,
            graveyard: [...ps.graveyard, card, ...consumed],
          };
          if (prog.effect) {
            // Apply as buff to all friendly
            if (prog.effect.kind === 'stat-buff' && prog.effect.target === 'all-friendly') {
              s[who] = {
                ...s[who],
                chordField: s[who].chordField.map(sp => ({
                  ...sp,
                  currentStrength: sp.currentStrength + (prog.effect!.kind === 'stat-buff' ? prog.effect!.amount : 0),
                  currentWill: sp.currentWill + (prog.effect!.kind === 'stat-buff' ? prog.effect!.amount : 0),
                })),
              };
              s[who] = drawCard(s[who], 2);
              s = addLog(s, `${prog.name}: all spirits gain +${prog.effect.amount} str & +2 will! Drew 2 cards.`);
            }
          }
        }
      }

      return s;
    }

    case 'DECLARE_ATTACK': {
      return resolveAttack(state, action.who, action.attackerInstanceId, action.targetInstanceId);
    }

    case 'END_TURN': {
      const { who } = action;
      const opp = who === 'player' ? 'ai' : 'player';
      let s = endTurnCleanup(state, who);
      s = addLog(s, `--- ${opp}'s turn ---`);
      s = { ...s, currentPlayer: opp, turnPhase: 'draw', turnNumber: s.turnNumber + (who === 'ai' ? 1 : 0) };
      // Draw for next player
      s[opp] = drawCard(s[opp]);
      return s;
    }

    case 'SELECT_NOTE':
      return { ...state, selectedNoteId: action.noteId };

    case 'SELECT_HAND_CARD':
      return { ...state, selectedHandCardId: action.cardId };

    case 'SELECT_ATTACKER':
      return { ...state, selectedAttackerInstanceId: action.instanceId, pendingTargetFor: action.instanceId ? 'attack' : null };

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
  return {
    phase: 'playing',
    currentPlayer: 'player',
    turnPhase: 'draw',
    turnNumber: 1,
    player: createPlayerState('player', playerMusician, playerInstrument, playerDeck),
    ai: createPlayerState('ai', aiMusician, aiInstrument, aiDeck),
    log: ['Game started! Your turn.'],
    selectedNoteId: null,
    selectedHandCardId: null,
    selectedAttackerInstanceId: null,
    pendingTargetFor: null,
  };
}
