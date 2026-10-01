"use client";
import { useReducer, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type {
  AnyCard, FieldSpirit, GameAction, GameState, InstrumentCard, MusicianCard, NoteId, PlayerState, Side, SpellTarget,
} from "@/types";
import { gameReducer, createInitialState } from "@/lib/gameEngine";
import { getAIAction, getAIMulligan } from "@/lib/aiOpponent";
import { NOTE_MAP, noteIdOf } from "@/lib/musicTheory";
import {
  LANE_COUNT, NOTES_PER_TURN, canAddNote, canAttack, canMove, canPlayCard, castLanes, currentPower, laneOf,
  sameTarget, spellPaymentOptions, spellTargets, totalNotes,
} from "@/lib/rules";
import {
  playNote,
  playChord,
  playChordProgression,
  playVictoryFanfare,
  playDefeatSound,
  playCardPlace,
  resumeAudioContext,
} from "@/lib/audioEngine";
import { MUSICIANS, INSTRUMENTS, getAIDeck, getCardById } from "@/data/cards";
import NoteCard from "@/components/cards/NoteCard";
import { HandCard, FieldSpiritCard, EmptyLane, NoteCost, type LaneHighlight } from "@/components/cards/ChordCard";
import SelectNoteCard from "../cards/SelectNoteCard";

// ─── Sounds for an action (player or AI), looked up before it's applied ──────
function playActionSound(action: GameAction, state: GameState) {
  switch (action.type) {
    case "ADD_NOTE":
      playNote(action.noteId);
      break;
    case "CAST_SPIRIT": {
      const card = getCardById(action.cardId);
      playCardPlace();
      if (card?.type === "chord-spirit") setTimeout(() => playChord(card.requiredNotes, true), 200);
      if (card?.type === "song-spirit") {
        const chords = card.requiredChordIds
          .map((id) => getCardById(id))
          .map((c) => (c && c.type === "chord-spirit" ? c.requiredNotes : []));
        setTimeout(() => playChordProgression(chords), 200);
      }
      break;
    }
    case "CAST_SPELL": {
      const card = state[action.who].hand.find((c) => c.id === action.cardId);
      if (card?.type === "chord-spell") playChord(card.requiredNotes);
      break;
    }
    case "ATTACK":
    case "MOVE_SPIRIT":
      playCardPlace();
      break;
  }
}

// ─── Hero Zone ────────────────────────────────────────────────────────────────
function HeroZone({
  player,
  isTarget,
  onClick,
}: {
  player: PlayerState;
  isTarget?: boolean;
  onClick?: () => void;
}) {
  const { musician, instrument, hp, maxHp } = player;
  const pct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = pct > 50 ? "#4ade80" : pct > 25 ? "#facc15" : "#ef4444";

  return (
    <button
      onClick={onClick}
      disabled={!isTarget}
      className={clsx(
        "relative flex-none rounded-xl border-2 flex flex-col justify-center px-4 py-2 transition-all duration-200 w-64 text-left",
        isTarget && "animate-pulse cursor-pointer border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]",
        !isTarget && "border-white/10 cursor-default",
      )}
      style={{ background: musician.artGradient }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-cinzel font-bold text-white text-lg leading-tight truncate">{musician.name}</div>
        <div className="font-cinzel font-bold text-lg flex-none" style={{ color: hpColor }}>
          ♥ {Math.max(0, hp)}/{maxHp}
        </div>
      </div>
      <div className="font-cinzel text-white/50 text-xs mb-1.5 truncate">
        {musician.subtitle} · {instrument.name} ({instrument.allowedKey})
      </div>
      <div className="w-full bg-black/50 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: hpColor, boxShadow: `0 0 6px ${hpColor}` }}
        />
      </div>
    </button>
  );
}

// ─── Note pool (one chip per note in the instrument's scale) ─────────────────
function NotePool({ player }: { player: PlayerState }) {
  const scale = player.instrument.allowedNotes.map(noteIdOf).filter((id): id is NoteId => !!id);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {scale.map((id) => (
        <NoteCard key={id} note={NOTE_MAP[id]} untapped={player.pool[id] ?? 0} tapped={player.tappedPool[id] ?? 0} />
      ))}
      <span className="font-cinzel text-white/30 text-xs ml-1">Reserve: {totalNotes(player.reserve)}</span>
    </div>
  );
}

function PileCounts({ player }: { player: PlayerState }) {
  return (
    <div className="font-cinzel text-white/35 text-xs leading-relaxed">
      <div>Hand {player.hand.length}</div>
      <div>Deck {player.deck.length}</div>
      <div>Discard {player.graveyard.length}</div>
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
      className="h-full overflow-y-auto border border-white/10 rounded-lg p-2 bg-black/40 font-cinzel text-sm"
    >
      {logs.map((l, i) => (
        <div key={i} className={clsx("leading-relaxed", l.startsWith("---") ? "text-gold-400/70 mt-1" : "text-white/60")}>
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
  onGameOver?: (winner: Side) => void;
}

export default function GameBoard({
  playerMusician,
  playerInstrument,
  playerDeck,
  onGameOver,
}: Props) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(
      playerMusician,
      playerInstrument,
      playerDeck,
      MUSICIANS[1], // The Resonant
      INSTRUMENTS[0], // Southern Belle
      getAIDeck(),
    ),
  );
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [paymentIndex, setPaymentIndex] = useState(0);

  const me = state.player;
  const ai = state.ai;
  const isPlayerTurn = state.phase === "playing" && state.currentPlayer === "player";

  const act = (action: GameAction) => {
    resumeAudioContext();
    playActionSound(action, state);
    dispatch(action);
  };

  // ── AI: mulligan, then one action at a time from the live state ───────────
  const aiSteps = useRef(0);
  useEffect(() => {
    if (state.phase === "mulligan" && !state.ai.mulliganDone) {
      dispatch(getAIMulligan(state));
      return;
    }
    if (state.phase !== "playing" || state.currentPlayer !== "ai") {
      aiSteps.current = 0;
      return;
    }
    const timer = setTimeout(() => {
      const action: GameAction =
        ++aiSteps.current > 60 ? { type: "END_TURN", who: "ai" } : getAIAction(state);
      playActionSound(action, state);
      dispatch(action);
    }, 650);
    // The AI only picks legal actions, but if one ever changed nothing this effect wouldn't re-run: end its turn
    const watchdog = setTimeout(() => dispatch({ type: "END_TURN", who: "ai" }), 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(watchdog);
    };
  }, [state]);

  // ── Game over ─────────────────────────────────────────────────────────────
  const reported = useRef(false);
  useEffect(() => {
    if (state.phase === "game-over" && state.winner && !reported.current) {
      reported.current = true;
      if (state.winner === "player") playVictoryFanfare();
      else playDefeatSound();
      onGameOver?.(state.winner);
    }
  }, [state.phase, state.winner]);

  // ── Current selection ─────────────────────────────────────────────────────
  const selectedCard = state.selectedHandIndex !== null ? me.hand[state.selectedHandIndex] ?? null : null;
  const selectedSpell = selectedCard?.type === "chord-spell" ? selectedCard : null;
  const payments = selectedSpell ? spellPaymentOptions(state, "player", selectedSpell) : [];
  const payment = payments[Math.min(paymentIndex, payments.length - 1)] ?? null;
  const targets = selectedSpell ? spellTargets(state, selectedSpell) : [];
  const isTarget = (t: SpellTarget) => targets.some((x) => sameTarget(x, t));
  const castableLanes = selectedCard && selectedCard.type !== "chord-spell" ? castLanes(state, "player", selectedCard) : [];

  const selectedSpirit = state.selectedSpiritId
    ? me.lanes.find((sp) => sp?.instanceId === state.selectedSpiritId) ?? null
    : null;
  const selectedLane = selectedSpirit ? laneOf(me, selectedSpirit.instanceId) : -1;
  const selectedCanAttack = selectedSpirit ? canAttack(state, "player", selectedSpirit) : false;
  const canMoveSomewhere = (sp: FieldSpirit) =>
    [...Array(LANE_COUNT).keys()].some((l) => canMove(state, "player", sp, l));

  // ── Interaction handlers ──────────────────────────────────────────────────
  const castSpellAt = (target: SpellTarget) => {
    if (!selectedSpell || !payment || !isTarget(target)) return;
    act({ type: "CAST_SPELL", who: "player", cardId: selectedSpell.id, target, payment });
  };

  const handleHandClick = (index: number) => {
    resumeAudioContext();
    if (!isPlayerTurn) return;
    if (state.selectedHandIndex === index) {
      dispatch({ type: "SELECT_HAND_CARD", index: null });
      return;
    }
    if (canPlayCard(state, "player", me.hand[index])) {
      setPaymentIndex(0);
      dispatch({ type: "SELECT_HAND_CARD", index });
    }
  };

  const handleMyLaneClick = (lane: number) => {
    resumeAudioContext();
    if (!isPlayerTurn) return;
    const sp = me.lanes[lane];
    if (selectedCard && selectedCard.type !== "chord-spell" && castableLanes.includes(lane)) {
      act({ type: "CAST_SPIRIT", who: "player", cardId: selectedCard.id, lane });
      return;
    }
    if (selectedSpell) {
      if (sp) castSpellAt({ kind: "spirit", instanceId: sp.instanceId });
      return;
    }
    if (selectedSpirit && !sp && canMove(state, "player", selectedSpirit, lane)) {
      act({ type: "MOVE_SPIRIT", who: "player", instanceId: selectedSpirit.instanceId, lane });
      return;
    }
    if (sp) {
      dispatch({ type: "SELECT_SPIRIT", instanceId: sp.instanceId === state.selectedSpiritId ? null : sp.instanceId });
    }
  };

  const handleEnemyLaneClick = (lane: number) => {
    resumeAudioContext();
    if (!isPlayerTurn) return;
    const sp = ai.lanes[lane];
    if (selectedSpell) {
      if (sp) castSpellAt({ kind: "spirit", instanceId: sp.instanceId });
      return;
    }
    if (selectedSpirit && selectedCanAttack && lane === selectedLane) {
      act({ type: "ATTACK", who: "player", instanceId: selectedSpirit.instanceId });
    }
  };

  const handleHeroClick = (side: Side) => {
    resumeAudioContext();
    if (!isPlayerTurn) return;
    if (selectedSpell) {
      castSpellAt({ kind: "player", side });
      return;
    }
    if (side === "ai" && selectedSpirit && selectedCanAttack && ai.lanes[selectedLane] === null) {
      act({ type: "ATTACK", who: "player", instanceId: selectedSpirit.instanceId });
    }
  };

  const handleAddNote = (noteId: NoteId) => {
    if (!canAddNote(state, "player", noteId)) return;
    act({ type: "ADD_NOTE", who: "player", noteId });
    if (me.notesAddedThisTurn + 1 >= NOTES_PER_TURN) setNotePickerOpen(false);
  };

  // ── Highlights ────────────────────────────────────────────────────────────
  const myLaneHighlight = (lane: number): { highlight: LaneHighlight; label?: string } => {
    const sp = me.lanes[lane];
    if (!isPlayerTurn) return { highlight: null };
    if (castableLanes.includes(lane)) return { highlight: "open", label: "Cast here" };
    if (selectedSpell) return { highlight: sp && isTarget({ kind: "spirit", instanceId: sp.instanceId }) ? "target" : null };
    if (selectedSpirit) {
      if (sp?.instanceId === selectedSpirit.instanceId) return { highlight: "selected" };
      if (!sp && canMove(state, "player", selectedSpirit, lane)) return { highlight: "open", label: "Move here" };
    }
    if (selectedCard) return { highlight: null };
    if (sp && (canAttack(state, "player", sp) || canMoveSomewhere(sp))) return { highlight: "selectable" };
    return { highlight: null };
  };

  const enemyLaneHighlight = (lane: number): { highlight: LaneHighlight; label?: string } => {
    const sp = ai.lanes[lane];
    if (!isPlayerTurn) return { highlight: null };
    if (selectedSpell) return { highlight: sp && isTarget({ kind: "spirit", instanceId: sp.instanceId }) ? "target" : null };
    if (selectedSpirit && selectedCanAttack && lane === selectedLane) {
      return { highlight: "target", label: "Attack player" };
    }
    return { highlight: null };
  };

  const aiHeroTargetable =
    isPlayerTurn &&
    (selectedSpell
      ? isTarget({ kind: "player", side: "ai" })
      : !!selectedSpirit && selectedCanAttack && ai.lanes[selectedLane] === null);
  const myHeroTargetable = isPlayerTurn && !!selectedSpell && isTarget({ kind: "player", side: "player" });

  // ── Hint text ─────────────────────────────────────────────────────────────
  let hint = "Add notes, cast cards, move a spirit, or attack.";
  if (state.phase === "mulligan") hint = "Keep your opening hand or mulligan once.";
  else if (state.phase === "game-over") hint = "Game over.";
  else if (!isPlayerTurn) hint = "The AI is playing…";
  else if (selectedCard && selectedCard.type !== "chord-spell") hint = `Choose a lane for ${selectedCard.name}.`;
  else if (selectedSpell) hint = `Choose a target for ${selectedSpell.name}.`;
  else if (selectedSpirit) {
    const parts = [];
    if (selectedCanAttack) parts.push(ai.lanes[selectedLane] ? "attack the spirit across from it" : "attack the player (lane is open)");
    if (canMoveSomewhere(selectedSpirit)) parts.push("move it to an empty lane");
    hint = parts.length ? `${selectedSpirit.card.name}: ${parts.join(", or ")}.` : `${selectedSpirit.card.name} can't act right now.`;
  }

  const renderLane = (side: Side, lane: number) => {
    const ps = state[side];
    const sp = ps.lanes[lane];
    const { highlight, label } = side === "player" ? myLaneHighlight(lane) : enemyLaneHighlight(lane);
    const onClick = side === "player" ? () => handleMyLaneClick(lane) : () => handleEnemyLaneClick(lane);
    return sp ? (
      <FieldSpiritCard
        key={sp.instanceId}
        spirit={sp}
        power={currentPower(ps, sp)}
        highlight={highlight}
        onClick={onClick}
        isOwnersTurn={state.currentPlayer === side}
      />
    ) : (
      <EmptyLane key={`${side}-${lane}`} lane={lane} highlight={highlight} label={label} onClick={onClick} />
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg, #080818 0%, #0d0d2b 50%, #080818 100%)" }}
    >
      <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4 py-3 gap-2 min-w-0">
        {/* ── AI side ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <HeroZone player={ai} isTarget={aiHeroTargetable} onClick={() => handleHeroClick("ai")} />
          <NotePool player={ai} />
          <div className="ml-auto flex items-center gap-4">
            <PileCounts player={ai} />
            {!isPlayerTurn && state.phase === "playing" && (
              <span className="font-cinzel text-gold-400 text-lg animate-pulse">Thinking...</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 justify-items-center">
          {[...Array(LANE_COUNT).keys()].map((lane) => renderLane("ai", lane))}
        </div>

        {/* ── Divider ── */}
        <div className="grid grid-cols-4 gap-3 items-center">
          {[...Array(LANE_COUNT).keys()].map((lane) => (
            <div key={lane} className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
              <span className="font-cinzel text-gold-500/60 text-[10px] tracking-widest">LANE {lane + 1}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 justify-items-center">
          {[...Array(LANE_COUNT).keys()].map((lane) => renderLane("player", lane))}
        </div>

        {/* ── Player side ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <HeroZone player={me} isTarget={myHeroTargetable} onClick={() => handleHeroClick("player")} />
          <SelectNoteCard
            onClick={() => setNotePickerOpen(true)}
            enabled={isPlayerTurn && me.notesAddedThisTurn < NOTES_PER_TURN && totalNotes(me.reserve) > 0}
            remaining={NOTES_PER_TURN - me.notesAddedThisTurn}
          />
          <NotePool player={me} />
          <div className="ml-auto flex items-center gap-4">
            <PileCounts player={me} />
            {isPlayerTurn && <span className="font-cinzel text-gold-400/80 text-lg font-bold">Your Turn</span>}
          </div>
        </div>

        {/* ── Hand ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 min-h-[232px]">
          {me.hand.map((card, i) => (
            <HandCard
              key={`${card.id}-${i}`}
              card={card}
              isSelected={state.selectedHandIndex === i}
              isPlayable={isPlayerTurn && canPlayCard(state, "player", card)}
              onClick={() => handleHandClick(i)}
            />
          ))}
          {me.hand.length === 0 && (
            <div className="font-cinzel text-white/20 text-sm italic self-center">Empty hand</div>
          )}
        </div>

        {/* ── Note picker ── */}
        {notePickerOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-fit text-center relative border border-white/10">
              <button className="absolute top-1 right-2 p-2 text-xl text-white/60 hover:text-white" onClick={() => setNotePickerOpen(false)}>
                ✕
              </button>
              <h2 className="text-2xl font-cinzel font-bold mb-1 text-gold-400">Add Notes</h2>
              <p className="font-cinzel text-white/50 text-sm mb-4">
                {NOTES_PER_TURN - me.notesAddedThisTurn} left this turn · numbers show what&apos;s left in your reserve
              </p>
              <div className="flex flex-wrap gap-4 justify-center max-w-3xl">
                {me.instrument.allowedNotes.map(noteIdOf).filter((id): id is NoteId => !!id).map((id) => {
                  const n = NOTE_MAP[id];
                  const enabled = canAddNote(state, "player", id);
                  return (
                    <button
                      key={id}
                      disabled={!enabled}
                      className={clsx(
                        "relative rounded-full w-20 h-20 flex items-center justify-center font-cinzel font-bold text-black text-3xl",
                        !enabled && "opacity-30 cursor-not-allowed",
                      )}
                      style={{ backgroundColor: n.color, boxShadow: enabled ? `0 0 8px ${n.color}` : "none" }}
                      onClick={() => handleAddNote(id)}
                    >
                      {n.primaryNote}
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black border border-white/40 text-white text-xs flex items-center justify-center">
                        {me.reserve[id] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Mulligan ── */}
        {state.phase === "mulligan" && !me.mulliganDone && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl border-2 border-gold-500/60 p-6 text-center max-w-6xl" style={{ background: "linear-gradient(135deg, #0a0a1a, #1a1a3a)" }}>
              <h2 className="font-cinzel font-bold text-3xl text-gold-400 mb-1">Opening Hand</h2>
              <p className="font-cinzel text-white/60 mb-1">{state.log[0]}</p>
              <p className="font-crimson text-white/50 italic mb-4">You may mulligan once for free: shuffle this hand away and draw a new one.</p>
              <div className="flex gap-2 justify-center flex-wrap mb-6">
                {me.hand.map((card, i) => (
                  <HandCard key={`${card.id}-${i}`} card={card} />
                ))}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => dispatch({ type: "KEEP_HAND", who: "player" })}
                  className="px-8 py-3 rounded-xl font-cinzel font-bold border-2 border-gold-500 text-gold-400 hover:bg-gold-500/10 transition-all"
                >
                  Keep Hand
                </button>
                <button
                  onClick={() => dispatch({ type: "MULLIGAN", who: "player" })}
                  className="px-8 py-3 rounded-xl font-cinzel font-bold border-2 border-white/20 text-white/70 hover:bg-white/5 transition-all"
                >
                  Mulligan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Game Over Overlay ── */}
        {state.phase === "game-over" && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div
              className="rounded-2xl border-2 p-10 text-center"
              style={{
                borderColor: state.winner === "player" ? "#d4af37" : "#ef4444",
                background: "linear-gradient(135deg, #0a0a1a, #1a1a3a)",
                boxShadow:
                  state.winner === "player"
                    ? "0 0 40px rgba(212,175,55,0.5)"
                    : "0 0 40px rgba(239,68,68,0.5)",
              }}
            >
              <div className="font-cinzel text-5xl mb-2">
                {state.winner === "player" ? "♫" : "♩"}
              </div>
              <div
                className="font-cinzel font-bold text-4xl mb-2"
                style={{ color: state.winner === "player" ? "#d4af37" : "#ef4444" }}
              >
                {state.winner === "player" ? "Victory!" : "Defeated"}
              </div>
              <div className="font-cinzel text-white/60 text-lg mb-6">
                {state.winner === "player"
                  ? "Your chord progression rang out victorious!"
                  : "The dissonance overwhelmed you..."}
              </div>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-8 py-3 rounded-xl font-cinzel font-bold border-2 border-gold-500 text-gold-400 hover:bg-gold-500/10 transition-all"
              >
                Return to Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar: status, spell payment, log, end turn ── */}
      <div className="flex-none w-80 p-4 flex flex-col gap-3 border-l border-white/5 bg-black/20">
        <div className="font-cinzel text-white/40 text-sm">Turn {state.turnNumber}</div>
        <div className="font-cinzel text-cyan-300 text-sm min-h-[40px]">{hint}</div>

        {selectedSpell && payments.length > 0 && (
          <div className="rounded-lg border border-white/10 p-2 bg-black/40">
            <div className="font-cinzel text-white/50 text-xs mb-1">Pay with</div>
            {payments.map((p, i) => {
              const tapped = p.kind === "spirit" ? me.lanes.find((sp) => sp?.instanceId === p.instanceId) : null;
              return (
                <label key={i} className="flex items-center gap-2 py-1 cursor-pointer font-cinzel text-sm text-white/80">
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === p}
                    onChange={() => setPaymentIndex(i)}
                  />
                  {p.kind === "notes" ? (
                    <span className="flex items-center gap-2">Notes <NoteCost notes={selectedSpell.requiredNotes} /></span>
                  ) : (
                    <span>Tap {tapped?.card.name} (lane {laneOf(me, p.instanceId) + 1})</span>
                  )}
                </label>
              );
            })}
          </div>
        )}

        <div className="flex-1 min-h-0">
          <GameLog logs={state.log} />
        </div>

        <button
          onClick={() => act({ type: "END_TURN", who: "player" })}
          disabled={!isPlayerTurn}
          className={clsx(
            "px-6 py-3 rounded-xl font-cinzel font-bold text-sm border-2 transition-all duration-200",
            isPlayerTurn
              ? "border-gold-500 text-gold-400 hover:bg-gold-500/10 hover:shadow-[0_0_16px_rgba(212,175,55,0.4)] cursor-pointer"
              : "border-white/10 text-white/20 cursor-not-allowed",
          )}
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          End Turn →
        </button>
      </div>
    </div>
  );
}
