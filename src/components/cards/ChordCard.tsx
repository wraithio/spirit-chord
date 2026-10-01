'use client';
import type { AnyCard, FieldSpirit } from '@/types';
import clsx from 'clsx';
import { NOTE_MAP, noteIdOf } from '@/lib/musicTheory';

const TYPE_LABEL: Record<AnyCard['type'], string> = {
  'chord-spirit': 'Chord Spirit',
  'song-spirit': 'Song Spirit',
  'chord-spell': 'Chord Spell',
};
const TYPE_COLOR: Record<AnyCard['type'], string> = {
  'chord-spirit': '#9d4edd',
  'song-spirit': '#d4af37',
  'chord-spell': '#0ea5e9',
};
const TYPE_SYMBOL: Record<AnyCard['type'], string> = {
  'chord-spirit': '♩',
  'song-spirit': '♫',
  'chord-spell': '♪',
};

// Colored note chips for a card's cost
export function NoteCost({ notes, size = 'sm' }: { notes: string[]; size?: 'sm' | 'md' }) {
  return (
    <div className="flex gap-1">
      {notes.map((n, i) => {
        const def = NOTE_MAP[noteIdOf(n) ?? 'C'];
        return (
          <span
            key={i}
            className={clsx(
              'rounded-full flex items-center justify-center font-cinzel font-bold text-black',
              size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm',
            )}
            style={{ backgroundColor: def.color, boxShadow: `0 0 4px ${def.color}` }}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}

function HarmonyTokens({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="text-cyan-300 font-cinzel font-bold text-sm" title={`${count} Harmony`}>
      {'◈'.repeat(Math.min(count, 4))}{count > 4 ? `×${count}` : ''}
    </span>
  );
}

// ─── Hand Card (shown in a player's hand) ────────────────────────────────────
interface HandCardProps {
  card: AnyCard;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  fill?: boolean;            // size from the parent row height instead of a fixed size
}

export function HandCard({ card, isSelected, isPlayable, onClick, fill }: HandCardProps) {
  const isSpirit = card.type !== 'chord-spell';
  const borderColor = isSelected ? '#d4af37' : isPlayable ? '#4ade80' : '#2a2a5a';

  return (
    <button
      onClick={onClick}
      disabled={!onClick || (!isPlayable && !isSelected)}
      className={clsx(
        'relative flex-none rounded-xl border-2 flex flex-col overflow-hidden transition-all duration-200 select-none text-left',
        fill ? 'h-full max-h-60 aspect-[5/7]' : 'w-40 h-56',
        isSelected && 'scale-105 -translate-y-2',
        isPlayable && !isSelected && 'hover:scale-102 hover:-translate-y-1 cursor-pointer',
        !isPlayable && !isSelected && onClick && 'opacity-50 cursor-not-allowed',
      )}
      style={{
        borderColor,
        background: card.artGradient,
        boxShadow: isSelected
          ? '0 0 24px rgba(212,175,55,0.7), 0 8px 24px rgba(0,0,0,0.5)'
          : isPlayable
          ? '0 0 12px rgba(74,222,128,0.4), 0 4px 12px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="px-2 pt-1.5 pb-1 bg-black/60">
        <div className="font-cinzel font-bold text-white leading-tight truncate text-sm">{card.name}</div>
        <div className="font-cinzel text-[11px]" style={{ color: TYPE_COLOR[card.type] }}>{TYPE_LABEL[card.type]}</div>
      </div>

      {/* Cost */}
      <div className="px-2 py-1 bg-black/40 min-h-[32px] flex items-center">
        {card.type === 'song-spirit'
          ? <span className="font-cinzel text-gold-400 text-[11px]">Combine {card.romanNumeral}</span>
          : <NoteCost notes={card.requiredNotes} />}
      </div>

      {/* Art area */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
        <span className="relative z-10 font-cinzel text-white/20 text-5xl">{TYPE_SYMBOL[card.type]}</span>
        <div className="absolute bottom-0.5 right-2 font-cinzel font-bold text-white/40 text-sm">
          {card.type !== 'song-spirit' && card.romanNumeral}
        </div>
      </div>

      {/* Stats / text */}
      <div className="px-2 py-1 bg-black/70">
        {isSpirit && (
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-cinzel font-bold text-base">{card.power}⚔</span>
            <HarmonyTokens count={card.harmony} />
            {card.keywords.map(k => (
              <span key={k} className="text-gold-400 font-cinzel text-[10px]">[{k}]</span>
            ))}
          </div>
        )}
        {card.abilityText && (
          <p className="text-white/60 leading-tight text-[11px] line-clamp-3 [@media(max-height:640px)]:line-clamp-2">{card.abilityText}</p>
        )}
      </div>

      {isPlayable && !isSelected && (
        <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-400/30 animate-pulse" />
      )}
      {card.rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />
        </div>
      )}
    </button>
  );
}

// ─── Lane highlight states ───────────────────────────────────────────────────
export type LaneHighlight = 'selected' | 'target' | 'selectable' | 'open' | null;

const HIGHLIGHT_BORDER: Record<Exclude<LaneHighlight, null>, string> = {
  selected: '#d4af37',
  target: '#ef4444',
  selectable: '#4ade80',
  open: '#38bdf8',
};

// ─── Field Spirit (in a lane) ────────────────────────────────────────────────
interface FieldSpiritCardProps {
  spirit: FieldSpirit;
  power: number;             // current Power (needs the owner's board for auras)
  highlight?: LaneHighlight;
  onClick?: () => void;
  isOwnersTurn?: boolean;    // "Just arrived" only matters on the owner's turn
}

export function FieldSpiritCard({ spirit, power, highlight = null, onClick, isOwnersTurn = true }: FieldSpiritCardProps) {
  const { card, isTapped, enteredThisTurn, harmony, attachments } = spirit;
  const canAct = !enteredThisTurn || card.keywords.includes('Tempo');
  const powerColor = power > card.power ? '#4ade80' : power < card.power ? '#f87171' : '#fb923c';

  return (
    <button
      onClick={onClick}
      disabled={!onClick || !highlight}
      className={clsx(
        'relative rounded-lg border-2 flex flex-col overflow-hidden transition-all duration-200 select-none h-full max-h-52 max-w-full aspect-[5/6] text-left',
        highlight === 'selected' && 'scale-105 shadow-[0_0_20px_rgba(212,175,55,0.7)]',
        highlight === 'target' && 'shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse cursor-pointer',
        highlight === 'selectable' && 'hover:scale-105 cursor-pointer',
        highlight === 'open' && 'cursor-pointer',
      )}
      style={{ borderColor: highlight ? HIGHLIGHT_BORDER[highlight] : '#2a2a5a', background: card.artGradient }}
    >
      {/* Name */}
      <div className="px-1.5 pt-1 bg-black/60">
        <div className="font-cinzel font-bold text-white leading-tight text-sm truncate">{card.name}</div>
        <div className="font-cinzel text-purple-300 text-xs">{card.romanNumeral}</div>
      </div>

      {/* Art + attachments */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center gap-1 px-1">
        <span className="font-cinzel text-white/25 text-4xl">{card.type === 'song-spirit' ? '♫' : '♩'}</span>
        <div className="flex flex-wrap gap-1 justify-center">
          {attachments.map((a, i) => (
            <span key={i} className="text-[10px] font-cinzel rounded px-1 bg-black/60 border border-cyan-400/40 text-cyan-200">
              {a.card.name}{a.spellproof ? ' ⛨' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-1.5 pb-1 bg-black/70 flex justify-between items-center">
        <span className="font-cinzel font-bold text-xl" style={{ color: powerColor }}>{power}⚔</span>
        <div className="flex items-center gap-1">
          {card.keywords.includes('Tempo') && <span className="text-yellow-400 text-[10px] font-cinzel">Tempo</span>}
          <HarmonyTokens count={harmony + attachments.length} />
        </div>
      </div>

      {/* Tapped / summoning overlays */}
      {isTapped && (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
          <span className="font-cinzel text-white/60 text-xs tracking-widest rotate-[-12deg] border border-white/30 px-2 py-0.5 rounded">TAPPED</span>
        </div>
      )}
      {!isTapped && !canAct && isOwnersTurn && (
        <div className="absolute top-12 left-0 right-0 bg-black/60 text-center pointer-events-none">
          <span className="text-white/50 font-cinzel text-[10px]">Just arrived</span>
        </div>
      )}
    </button>
  );
}

// ─── Empty lane slot ─────────────────────────────────────────────────────────
interface EmptyLaneProps {
  lane: number;
  highlight?: LaneHighlight;
  label?: string;           // shown when highlighted, e.g. "Cast here"
  onClick?: () => void;
}

export function EmptyLane({ lane, highlight = null, label, onClick }: EmptyLaneProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick || !highlight}
      className={clsx(
        'rounded-lg border-2 border-dashed h-full max-h-52 max-w-full aspect-[5/6] flex flex-col items-center justify-center transition-all duration-200',
        highlight ? 'cursor-pointer bg-white/5 hover:bg-white/10' : 'bg-black/20',
        highlight === 'target' && 'animate-pulse',
      )}
      style={{ borderColor: highlight ? HIGHLIGHT_BORDER[highlight] : 'rgba(255,255,255,0.08)' }}
    >
      <span className="font-cinzel text-white/15 text-xs tracking-widest">LANE {lane + 1}</span>
      {highlight && label && (
        <span className="font-cinzel text-sm mt-2" style={{ color: HIGHLIGHT_BORDER[highlight] }}>{label}</span>
      )}
    </button>
  );
}
