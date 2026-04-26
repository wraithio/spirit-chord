import type { GameState, GameAction, NoteId } from '@/types';
import { NOTE_SPIRITS } from './musicTheory';
import { canAffordCard } from './gameEngine';

// ─── AI Decision Engine ───────────────────────────────────────────────────────
// Simple rule-based AI that:
// 1. Plays a note that helps form a chord in hand
// 2. Plays affordable chord spirits / spells
// 3. Attacks optimally (target lowest-will enemy, or hero if clear path)

export function getAIActions(state: GameState): GameAction[] {
  const actions: GameAction[] = [];
  const ai = state.ai;

  // ── Step 1: Play a note that helps form a chord in hand ──────────────────
  if (!ai.playedNoteThisTurn) {
    const noteAction = chooseNote(state);
    if (noteAction) actions.push(noteAction);
  }

  // ── Step 2: Play cards from hand that are affordable ─────────────────────
  // Sort hand: chord progressions first (most impactful), then chord spirits, then spells
  const sortedHand = [...ai.hand].sort((a, b) => {
    const priority: Record<string, number> = { 'chord-progression': 0, 'chord-spirit': 1, 'song-spell': 2 };
    return priority[a.type] - priority[b.type];
  });

  for (const card of sortedHand) {
    // Re-check affordability after each play (note field changes)
    const currentAI = state.ai;
    if (canAffordCard(card, currentAI.noteField, currentAI.chordField)) {
      if (card.type === 'song-spell') {
        // Pick best target for spell
        const target = chooseSpellTarget(state, card.id);
        actions.push({ type: 'PLAY_CARD', who: 'ai', cardId: card.id, targetInstanceId: target });
      } else {
        actions.push({ type: 'PLAY_CARD', who: 'ai', cardId: card.id });
      }
    }
  }

  // ── Step 3: Attack with all available spirits ─────────────────────────────
  for (const spirit of ai.chordField) {
    if (!spirit.canChallenge || spirit.isExhausted) continue;

    const target = chooseAttackTarget(state);
    actions.push({
      type: 'DECLARE_ATTACK',
      who: 'ai',
      attackerInstanceId: spirit.instanceId,
      targetInstanceId: target,
    });
  }

  // ── Step 4: End turn ──────────────────────────────────────────────────────
  actions.push({ type: 'END_TURN', who: 'ai' });

  return actions;
}

// ─── Choose which note to play ────────────────────────────────────────────────
function chooseNote(state: GameState): GameAction | null {
  const ai = state.ai;
  const fieldNotes = ai.noteField.map(n => n.chosenNote);

  // Find notes needed to complete any card in hand
  const neededNotes: string[] = [];
  for (const card of ai.hand) {
    if (card.type === 'chord-spirit' || card.type === 'song-spell') {
      for (const req of card.requiredNotes) {
        if (!fieldNotes.includes(req)) {
          neededNotes.push(req);
        }
      }
    }
  }

  // Pick most needed note
  if (neededNotes.length > 0) {
    const freq: Record<string, number> = {};
    for (const n of neededNotes) freq[n] = (freq[n] ?? 0) + 1;
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

    // Find note spirit ID for this note
    const noteDef = NOTE_SPIRITS.find(n => n.primaryNote === best || n.altNote === best);
    if (noteDef) {
      return { type: 'PLAY_NOTE', who: 'ai', noteId: noteDef.id as NoteId, chosenNote: best };
    }
  }

  // Fallback: play a random note not on field
  const available = NOTE_SPIRITS.filter(n => !fieldNotes.includes(n.primaryNote));
  if (available.length > 0) {
    const pick = available[Math.floor(Math.random() * available.length)];
    return { type: 'PLAY_NOTE', who: 'ai', noteId: pick.id as NoteId, chosenNote: pick.primaryNote };
  }

  return null;
}

// ─── Choose attack target ─────────────────────────────────────────────────────
function chooseAttackTarget(state: GameState): string | 'hero' {
  const playerField = state.player.chordField;

  // Must attack taunts first
  const taunts = playerField.filter(s => s.hasTaunt);
  if (taunts.length > 0) {
    return taunts[0].instanceId;
  }

  // If player has no spirits, go face
  if (playerField.length === 0) return 'hero';

  // Otherwise kill weakest spirit (lowest will)
  const weakest = playerField.reduce((a, b) => a.currentWill < b.currentWill ? a : b);
  return weakest.instanceId;
}

// ─── Choose spell target ──────────────────────────────────────────────────────
function chooseSpellTarget(state: GameState, cardId: string): string | undefined {
  const playerField = state.player.chordField;
  const aiField = state.ai.chordField;

  // Sunny Side Down → debuff strongest enemy
  if (cardId === 'spell-iii-sunny-side-down' && playerField.length > 0) {
    return playerField.reduce((a, b) => a.currentStrength > b.currentStrength ? a : b).instanceId;
  }

  // Solar Flare → buff weakest AI spirit (most likely to be in combat)
  if (cardId === 'spell-vi-solar-flare' && aiField.length > 0) {
    return aiField.reduce((a, b) => a.currentStrength < b.currentStrength ? a : b).instanceId;
  }

  // Perfect Cadence → destroy weakest enemy
  if (cardId === 'spell-V-cadence' && playerField.length > 0) {
    return playerField.reduce((a, b) => a.currentWill < b.currentWill ? a : b).instanceId;
  }

  return undefined;
}
