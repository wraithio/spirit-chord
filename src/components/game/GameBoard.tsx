'use client';
import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, NoteId, NoteOnField } from '@/types';
import { gameReducer, createInitialState } from '@/lib/gameEngine';
import { getAIActions } from '@/lib/aiOpponent';
import { NOTE_SPIRITS, NOTE_MAP } from '@/lib/musicTheory';
import {
  playNote, playChord, playChordProgression, playVictoryFanfare,
  playDefeatSound, playCardPlace, resumeAudioContext,
} from '@/lib/audioEngine';
import { MUSICIANS, INSTRUMENTS, getStarterDeck, getAIDeck } from '@/data/cards';
import NoteCard from '@/components/cards/NoteCard';
import { HandCard, FieldSpiritCard } from '@/components/cards/ChordCard';
import { canAffordCard } from '@/lib/gameEngine';
import type { MusicianCard, InstrumentCard, AnyCard, ChordSpiritCard, ChordProgressionCard } from '@/types';
import clsx from 'clsx';

// ─── Hero Zone ────────────────────────────────────────────────────────────────
function HeroZone({
  musician, hp, maxHp, isTarget, onClick, side,
}: {
  musician: MusicianCard;
  hp: number; maxHp: number;
  isTarget?: boolean; onClick?: () => void; side: 'player' | 'ai';
}) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#ef4444';

  return (
    <button
      onClick={onClick}
      disabled={!isTarget}
      className={clsx(
        'relative rounded-xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-200 min-w-[120px]',
        isTarget && 'animate-pulse cursor-pointer border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]',
        !isTarget && 'border-white/10 cursor-default',
      )}
      style={{ background: musician.artGradient, minHeight: '90px' }}
    >
      <div className="font-cinzel font-bold text-white text-sm leading-tight text-center">
        {musician.name}
      </div>
      <div className="font-cinzel text-white/50 text-xs mb-2">{musician.subtitle}</div>

      {/* HP Bar */}
      <div className="w-full bg-black/50 rounded-full h-2 mb-1">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: hpColor, boxShadow: `0 0 6px ${hpColor}` }}
        />
      </div>
      <div className="font-cinzel font-bold" style={{ color: hpColor, fontSize: '0.75rem' }}>
        ♥ {Math.max(0, hp)}/{maxHp}
      </div>

      {isTarget && (
        <div className="absolute inset-0 rounded-xl border-2 border-red-400 pointer-events-none animate-pulse" />
      )}
    </button>
  );
}

// ─── Note Field Row ───────────────────────────────────────────────────────────
function NoteFieldRow({ notes, label }: { notes: NoteOnField[]; label: string }) {
  if (notes.length === 0) return (
    <div className="h-8 flex items-center justify-center">
      <span className="text-white/20 font-cinzel text-xs italic">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-2 items-center flex-wrap justify-center py-1">
      {notes.map(n => {
        const def = NOTE_MAP[n.noteId];
        return (
          <div
            key={n.instanceId}
            className="w-8 h-8 rounded-md border flex items-center justify-center font-cinzel font-bold"
            style={{
              borderColor: def?.color ?? '#fff',
              color: def?.color ?? '#fff',
              background: 'rgba(0,0,0,0.5)',
              fontSize: '0.6rem',
              boxShadow: `0 0 6px ${def?.color ?? '#fff'}40`,
            }}
            title={n.chosenNote}
          >
            {n.chosenNote}
          </div>
        );
      })}
    </div>
  );
}

// ─── Game Log ─────────────────────────────────────────────────────────────────
function GameLog({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div
      ref={ref}
      className="h-28 overflow-y-auto border border-white/10 rounded-lg p-2 bg-black/40 font-cinzel"
      style={{ fontSize: '0.6rem' }}
    >
      {logs.map((l, i) => (
        <div key={i} className="text-white/60 leading-relaxed">
          <span className="text-gold-400/50">›</span> {l}
        </div>
      ))}
    </div>
  );
}

// ─── Main GameBoard ───────────────────────────────────────────────────────────
interface Props {
  playerMusician: MusicianCard;
  playerInstrument: InstrumentCard;
  playerDeck: AnyCard[];
  onGameOver?: (winner: 'player' | 'ai') => void;
}

export default function GameBoard({ playerMusician, playerInstrument, playerDeck, onGameOver }: Props) {
  const aiMusician = MUSICIANS[1]; // The Resonant
  const aiInstrument = INSTRUMENTS[0]; // Southern Belle
  const aiDeck = getAIDeck();

  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialState(playerMusician, playerInstrument, playerDeck, aiMusician, aiInstrument, aiDeck)
  );

  const isPlayerTurn = state.currentPlayer === 'player';
  const aiRunning = useRef(false);

  // ── AI turn execution ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state.currentPlayer !== 'ai' || state.phase === 'game-over' || aiRunning.current) return;
    aiRunning.current = true;

    const actions = getAIActions(state);
    let delay = 600;

    const timer = setTimeout(() => {
      actions.forEach((action, i) => {
        setTimeout(() => {
          dispatch(action);
          // Play sounds for AI actions
          if (action.type === 'PLAY_NOTE') {
            playNote(action.noteId as NoteId);
          }
          if (action.type === 'PLAY_CARD') {
            playCardPlace();
          }
          if (i === actions.length - 1) {
            aiRunning.current = false;
          }
        }, i * 700);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [state.currentPlayer, state.phase]);

  // ── Game over ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'game-over' && state.winner) {
      if (state.winner === 'player') playVictoryFanfare();
      else playDefeatSound();
      onGameOver?.(state.winner);
    }
  }, [state.phase, state.winner]);

  // ── Interaction handlers ──────────────────────────────────────────────────
  const handleNoteClick = useCallback((noteId: NoteId) => {
    resumeAudioContext();
    if (!isPlayerTurn || state.player.playedNoteThisTurn) return;

    const noteDef = NOTE_MAP[noteId];
    if (!noteDef) return;

    // Choose primary note by default (could show modal for enharmonic choice)
    const chosenNote = noteDef.primaryNote;
    playNote(noteId);
    dispatch({ type: 'PLAY_NOTE', who: 'player', noteId, chosenNote });
  }, [isPlayerTurn, state.player.playedNoteThisTurn]);

  const handleHandCardClick = useCallback((cardId: string) => {
    resumeAudioContext();
    if (!isPlayerTurn) return;

    if (state.selectedHandCardId === cardId) {
      dispatch({ type: 'SELECT_HAND_CARD', cardId: null });
      return;
    }

    const card = state.player.hand.find(c => c.id === cardId);
    if (!card) return;

    const affordable = canAffordCard(card, state.player.noteField, state.player.chordField);
    if (!affordable) return;

    // Spells that need a target — select first, then pick target
    if (card.type === 'song-spell' && ['any-spirit', 'enemy-spirit', 'friendly-spirit'].includes(
      (card as import('@/types').SongSpellCard).effect.target ?? ''
    )) {
      dispatch({ type: 'SELECT_HAND_CARD', cardId });
      return;
    }

    // No target needed — play immediately
    playCardPlace();
    if (card.type === 'chord-spirit') {
      const notes = (card as ChordSpiritCard).requiredNotes;
      setTimeout(() => playChord(notes, true), 200);
    }
    if (card.type === 'chord-progression') {
      const prog = card as ChordProgressionCard;
      // Build progression notes from required chord IDs
      const chordNotes = state.player.chordField
        .filter(s => prog.requiredChordIds.includes(s.card.id))
        .map(s => (s.card as ChordSpiritCard).requiredNotes ?? []);
      if (chordNotes.length > 0) setTimeout(() => playChordProgression(chordNotes), 200);
    }
    dispatch({ type: 'PLAY_CARD', who: 'player', cardId });
  }, [isPlayerTurn, state.selectedHandCardId, state.player, state.player.chordField]);

  const handleFieldSpiritClick = useCallback((instanceId: string, side: 'player' | 'ai') => {
    resumeAudioContext();
    if (!isPlayerTurn) return;

    const { selectedAttackerInstanceId, selectedHandCardId } = state;

    // If a spell is selected, use this spirit as target
    if (selectedHandCardId) {
      playCardPlace();
      dispatch({ type: 'PLAY_CARD', who: 'player', cardId: selectedHandCardId, targetInstanceId: instanceId });
      dispatch({ type: 'SELECT_HAND_CARD', cardId: null });
      return;
    }

    // Attack declaration
    if (selectedAttackerInstanceId && side === 'ai') {
      dispatch({ type: 'DECLARE_ATTACK', who: 'player', attackerInstanceId: selectedAttackerInstanceId, targetInstanceId: instanceId });
      dispatch({ type: 'SELECT_ATTACKER', instanceId: null });
      return;
    }

    // Select own spirit as attacker
    if (side === 'player') {
      const spirit = state.player.chordField.find(s => s.instanceId === instanceId);
      if (spirit?.canChallenge && !spirit.isExhausted) {
        dispatch({ type: 'SELECT_ATTACKER', instanceId: selectedAttackerInstanceId === instanceId ? null : instanceId });
      }
    }
  }, [isPlayerTurn, state.selectedAttackerInstanceId, state.selectedHandCardId, state.player.chordField]);

  const handleHeroClick = useCallback(() => {
    resumeAudioContext();
    if (!isPlayerTurn || !state.selectedAttackerInstanceId) return;

    // Check for taunts
    const aiTaunts = state.ai.chordField.filter(s => s.hasTaunt);
    if (aiTaunts.length > 0) return; // must attack taunts first

    dispatch({ type: 'DECLARE_ATTACK', who: 'player', attackerInstanceId: state.selectedAttackerInstanceId, targetInstanceId: 'hero' });
    dispatch({ type: 'SELECT_ATTACKER', instanceId: null });
  }, [isPlayerTurn, state.selectedAttackerInstanceId, state.ai.chordField]);

  const handleEndTurn = useCallback(() => {
    if (!isPlayerTurn) return;
    dispatch({ type: 'END_TURN', who: 'player' });
    dispatch({ type: 'SELECT_ATTACKER', instanceId: null });
    dispatch({ type: 'SELECT_HAND_CARD', cardId: null });
  }, [isPlayerTurn]);

  const hasTauntOnAI = state.ai.chordField.some(s => s.hasTaunt);
  const canAttackHero = !!state.selectedAttackerInstanceId && !hasTauntOnAI;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg, #080818 0%, #0d0d2b 50%, #080818 100%)' }}
    >
      {/* Musical staff lines decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        {[0.15, 0.25, 0.35, 0.65, 0.75, 0.85].map((pos, i) => (
          <div key={i} className="absolute w-full h-px bg-white" style={{ top: `${pos * 100}%` }} />
        ))}
      </div>

      {/* ── AI Side ── */}
      <div className="flex-none px-4 pt-3">
        <div className="flex items-start gap-4">
          {/* AI Hero */}
          <HeroZone
            musician={state.ai.musician}
            hp={state.ai.hp}
            maxHp={state.ai.maxHp}
            isTarget={canAttackHero && isPlayerTurn}
            onClick={handleHeroClick}
            side="ai"
          />

          {/* AI Info */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-white/40 text-xs">
                AI • Turn {state.turnNumber}
              </span>
              {!isPlayerTurn && (
                <span className="font-cinzel text-gold-400 text-xs animate-pulse">Thinking...</span>
              )}
              <span className="font-cinzel text-white/30 text-xs ml-auto">
                Hand: {state.ai.hand.length} | Deck: {state.ai.deck.length}
              </span>
            </div>
            {/* AI note field */}
            <NoteFieldRow notes={state.ai.noteField} label="No notes on field" />
          </div>
        </div>
      </div>

      {/* AI Chord Field */}
      <div className="flex-none px-4 py-2 min-h-[120px] flex items-center justify-center">
        {state.ai.chordField.length === 0 ? (
          <div className="text-white/10 font-cinzel text-sm italic">— AI battlefield empty —</div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center">
            {state.ai.chordField.map(spirit => (
              <FieldSpiritCard
                key={spirit.instanceId}
                spirit={spirit}
                isAttackTarget={!!state.selectedAttackerInstanceId && isPlayerTurn && (!hasTauntOnAI || spirit.hasTaunt)}
                canSelect={!!state.selectedAttackerInstanceId && isPlayerTurn}
                onClick={() => handleFieldSpiritClick(spirit.instanceId, 'ai')}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="flex-none mx-4 my-1 flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        <div className="font-cinzel text-gold-500/60 text-xs tracking-widest">⬩ BATTLEFIELD ⬩</div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      </div>

      {/* Player Chord Field */}
      <div className="flex-none px-4 py-2 min-h-[120px] flex items-center justify-center">
        {state.player.chordField.length === 0 ? (
          <div className="text-white/10 font-cinzel text-sm italic">— Your battlefield empty —</div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center">
            {state.player.chordField.map(spirit => (
              <FieldSpiritCard
                key={spirit.instanceId}
                spirit={spirit}
                isSelected={state.selectedAttackerInstanceId === spirit.instanceId}
                canSelect={isPlayerTurn && spirit.canChallenge && !spirit.isExhausted && !state.selectedHandCardId}
                onClick={() => handleFieldSpiritClick(spirit.instanceId, 'player')}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Player Side ── */}
      <div className="flex-none px-4 pb-1">
        <div className="flex items-start gap-4">
          <HeroZone
            musician={state.player.musician}
            hp={state.player.hp}
            maxHp={state.player.maxHp}
            side="player"
          />
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-gold-400/70 text-xs font-bold">Your Turn</span>
              <span className="font-cinzel text-white/30 text-xs ml-auto">
                Hand: {state.player.hand.length} | Deck: {state.player.deck.length}
              </span>
            </div>
            <NoteFieldRow notes={state.player.noteField} label="No notes played yet" />
          </div>
        </div>
      </div>

      {/* ── Note Selection Panel ── */}
      <div className="flex-none px-4 py-2 border-t border-white/5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-cinzel text-gold-400/80 text-xs font-bold tracking-wide">NOTE SPIRITS</span>
          {state.player.playedNoteThisTurn ? (
            <span className="font-cinzel text-white/30 text-xs">(played this turn)</span>
          ) : isPlayerTurn ? (
            <span className="font-cinzel text-green-400/70 text-xs">Choose 1 to play →</span>
          ) : null}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {NOTE_SPIRITS.map(note => {
            const onField = state.player.noteField.some(n => n.noteId === note.id);
            return (
              <NoteCard
                key={note.id}
                note={note}
                isOnField={onField}
                isAvailable={isPlayerTurn && !state.player.playedNoteThisTurn && !onField}
                onClick={() => handleNoteClick(note.id as NoteId)}
                size="sm"
              />
            );
          })}
        </div>
      </div>

      {/* ── Player Hand ── */}
      <div className="flex-1 px-4 py-2 border-t border-white/5 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-cinzel text-white/50 text-xs tracking-wide">YOUR HAND</span>
          {state.selectedHandCardId && (
            <span className="font-cinzel text-cyan-400 text-xs animate-pulse">
              Select target for spell...
            </span>
          )}
          {state.selectedAttackerInstanceId && (
            <span className="font-cinzel text-orange-400 text-xs animate-pulse">
              Select target to challenge...
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {state.player.hand.map(card => {
            const playable = canAffordCard(card, state.player.noteField, state.player.chordField);
            return (
              <HandCard
                key={`${card.id}-${state.player.hand.indexOf(card)}`}
                card={card}
                isSelected={state.selectedHandCardId === card.id}
                isPlayable={isPlayerTurn && playable}
                onClick={() => handleHandCardClick(card.id)}
                compact
              />
            );
          })}
          {state.player.hand.length === 0 && (
            <div className="font-cinzel text-white/20 text-sm italic self-center">Empty hand</div>
          )}
        </div>
      </div>

      {/* ── Controls & Log ── */}
      <div className="flex-none px-4 pb-3 flex gap-3 items-end">
        <div className="flex-1">
          <GameLog logs={state.log} />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleEndTurn}
            disabled={!isPlayerTurn}
            className={clsx(
              'px-6 py-3 rounded-xl font-cinzel font-bold text-sm border-2 transition-all duration-200',
              isPlayerTurn
                ? 'border-gold-500 text-gold-400 hover:bg-gold-500/10 hover:shadow-[0_0_16px_rgba(212,175,55,0.4)] cursor-pointer'
                : 'border-white/10 text-white/20 cursor-not-allowed',
            )}
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            End Turn →
          </button>
          <div className="font-cinzel text-center text-white/30" style={{ fontSize: '0.6rem' }}>
            Turn {state.turnNumber}
          </div>
        </div>
      </div>

      {/* ── Game Over Overlay ── */}
      {state.phase === 'game-over' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div
            className="rounded-2xl border-2 p-10 text-center"
            style={{
              borderColor: state.winner === 'player' ? '#d4af37' : '#ef4444',
              background: 'linear-gradient(135deg, #0a0a1a, #1a1a3a)',
              boxShadow: state.winner === 'player'
                ? '0 0 40px rgba(212,175,55,0.5)'
                : '0 0 40px rgba(239,68,68,0.5)',
            }}
          >
            <div className="font-cinzel text-5xl mb-2">
              {state.winner === 'player' ? '♫' : '♩'}
            </div>
            <div
              className="font-cinzel font-bold text-4xl mb-2"
              style={{ color: state.winner === 'player' ? '#d4af37' : '#ef4444' }}
            >
              {state.winner === 'player' ? 'Victory!' : 'Defeated'}
            </div>
            <div className="font-cinzel text-white/60 text-lg mb-6">
              {state.winner === 'player'
                ? 'Your chord progression rang out victorious!'
                : 'The dissonance overwhelmed you...'}
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 rounded-xl font-cinzel font-bold border-2 border-gold-500 text-gold-400 hover:bg-gold-500/10 transition-all"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
