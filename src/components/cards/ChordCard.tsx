'use client';
import type { AnyCard, ChordSpiritCard, SongSpellCard, ChordProgressionCard, FieldSpirit } from '@/types';
import clsx from 'clsx';

// ─── Hand Card (shown in player's hand) ──────────────────────────────────────
interface HandCardProps {
  card: AnyCard;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function HandCard({ card, isSelected, isPlayable, onClick, compact }: HandCardProps) {
  const isChord = card.type === 'chord-spirit';
  const isSpell = card.type === 'song-spell';
  const isProg = card.type === 'chord-progression';

  const cs = isChord ? card as ChordSpiritCard : null;
  const ss = isSpell ? card as SongSpellCard : null;
  const cp = isProg ? card as ChordProgressionCard : null;

  const typeLabel = isChord ? 'Chord Spirit' : isSpell ? 'Song Spell' : 'Chord Progression';
  const typeColor = isChord ? '#9d4edd' : isSpell ? '#0ea5e9' : '#d4af37';

  const borderColor = isSelected
    ? '#d4af37'
    : isPlayable
    ? '#4ade80'
    : '#2a2a5a';

  return (
    <button
      onClick={onClick}
      disabled={!isPlayable && !isSelected}
      className={clsx(
        'relative rounded-xl border-2 flex flex-col overflow-hidden transition-all duration-200 select-none text-left',
        compact ? 'w-28 h-40' : 'w-36 h-52',
        isSelected && 'scale-105 -translate-y-3',
        isPlayable && !isSelected && 'hover:scale-102 hover:-translate-y-1 cursor-pointer',
        !isPlayable && !isSelected && 'opacity-50 cursor-not-allowed',
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
        <div className="font-cinzel font-bold text-white leading-tight truncate" style={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>
          {card.name}
        </div>
        <div className="font-cinzel" style={{ fontSize: '0.5rem', color: typeColor }}>
          {typeLabel}
        </div>
      </div>

      {/* Notes required (spine) */}
      <div className="px-1.5 py-1 bg-black/40 flex flex-wrap gap-0.5">
        {card.type !== 'chord-progression'
          ? card.requiredNotes.map((n, i) => (
              <span key={i} className="text-white/80 font-cinzel font-bold" style={{ fontSize: '0.6rem' }}>
                {n}
              </span>
            ))
          : (card as ChordProgressionCard).requiredChordIds.map((id, i) => (
              <span key={i} className="text-gold-400 font-cinzel" style={{ fontSize: '0.5rem' }}>
                ♪
              </span>
            ))}
      </div>

      {/* Art area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: card.artGradient }} />
        <span className="relative z-10 font-cinzel text-white/20 text-4xl">
          {isChord ? '♩' : isSpell ? '♪' : '♫'}
        </span>
        {/* Roman numeral */}
        <div
          className="absolute bottom-1 right-2 font-cinzel font-bold text-white/40"
          style={{ fontSize: compact ? '0.55rem' : '0.65rem' }}
        >
          {card.romanNumeral}
        </div>
      </div>

      {/* Stats / text */}
      <div className="px-2 py-1 bg-black/70">
        {(isChord || (isProg && cp?.isMinion)) && (
          <div className="flex gap-2 mb-0.5">
            <span className="text-orange-400 font-cinzel font-bold" style={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>
              {(cs?.strength ?? cp?.strength ?? 0)}⚔
            </span>
            <span className="text-blue-400 font-cinzel font-bold" style={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>
              {(cs?.will ?? cp?.will ?? 0)}🛡
            </span>
          </div>
        )}
        <p className="text-white/60 leading-tight" style={{ fontSize: '0.5rem' }}>
          {card.abilityText.length > (compact ? 50 : 80)
            ? card.abilityText.slice(0, compact ? 47 : 77) + '...'
            : card.abilityText}
        </p>
        {/* Keywords */}
        {isChord && (cs?.keywords ?? []).length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {cs!.keywords.map(k => (
              <span key={k} className="text-gold-400 font-cinzel font-bold" style={{ fontSize: '0.45rem' }}>
                [{k}]
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Playable glow */}
      {isPlayable && !isSelected && (
        <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-400/30 animate-pulse" />
      )}

      {/* Legendary shimmer */}
      {card.rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />
        </div>
      )}
    </button>
  );
}

// ─── Field Spirit (on battlefield) ───────────────────────────────────────────
interface FieldSpiritCardProps {
  spirit: FieldSpirit;
  isSelected?: boolean;
  isAttackTarget?: boolean;
  canSelect?: boolean;
  onClick?: () => void;
  flipped?: boolean; // for AI side
}

export function FieldSpiritCard({ spirit, isSelected, isAttackTarget, canSelect, onClick, flipped }: FieldSpiritCardProps) {
  const { card, currentStrength, currentWill, canChallenge, isExhausted, hasTaunt } = spirit;
  const isChord = card.type === 'chord-spirit';
  const cs = isChord ? card as ChordSpiritCard : card as ChordProgressionCard;
  const keywords = isChord
    ? (card as ChordSpiritCard).keywords ?? []
    : (card as ChordProgressionCard).keywords ?? [];

  const borderColor = isSelected
    ? '#d4af37'
    : isAttackTarget
    ? '#ef4444'
    : hasTaunt
    ? '#22d3ee'
    : canSelect
    ? '#4ade80'
    : '#2a2a5a';

  return (
    <button
      onClick={onClick}
      disabled={!canSelect && !isAttackTarget}
      className={clsx(
        'relative rounded-lg border-2 flex flex-col overflow-hidden transition-all duration-200 select-none',
        'w-24 h-32',
        isSelected && 'scale-105 shadow-[0_0_20px_rgba(212,175,55,0.7)]',
        isAttackTarget && 'scale-105 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse',
        isExhausted && 'opacity-60',
        flipped && 'rotate-180',
        canSelect && !isSelected && 'hover:scale-105 cursor-pointer',
      )}
      style={{
        borderColor,
        background: card.artGradient,
        boxShadow: isSelected ? '0 0 20px rgba(212,175,55,0.6)' : undefined,
      }}
    >
      {/* Name */}
      <div className="px-1.5 pt-1 bg-black/60">
        <div className="font-cinzel font-bold text-white leading-tight" style={{ fontSize: '0.55rem' }}>
          {card.name}
        </div>
        <div className="font-cinzel text-purple-300" style={{ fontSize: '0.45rem' }}>
          {card.romanNumeral}
        </div>
      </div>

      {/* Art */}
      <div className="flex-1 flex items-center justify-center">
        {card.type === 'chord-progression' ? '♫' : '♩'}/
      </div>

      {/* Stats */}
      <div className="px-1.5 pb-1 bg-black/70 flex justify-between items-center">
        <span className="text-orange-400 font-cinzel font-bold" style={{ fontSize: '0.65rem' }}>
          {currentStrength}⚔
        </span>
        <div className="flex gap-0.5">
          {keywords.includes('Tempo') && (
            <span className="text-yellow-400" style={{ fontSize: '0.5rem' }}>T</span>
          )}
          {keywords.includes('Transfer') && (
            <span className="text-red-400" style={{ fontSize: '0.5rem' }}>X</span>
          )}
          {hasTaunt && (
            <span className="text-cyan-400" style={{ fontSize: '0.5rem' }}>◈</span>
          )}
        </div>
        <span className="text-blue-400 font-cinzel font-bold" style={{ fontSize: '0.65rem' }}>
          {currentWill}🛡
        </span>
      </div>

      {/* Exhausted overlay */}
      {isExhausted && (
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
          <span className="text-white/40 text-xs font-cinzel">✓</span>
        </div>
      )}

      {/* Can't challenge overlay */}
      {!canChallenge && !isExhausted && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center" style={{ fontSize: '0.4rem' }}>
          <span className="text-white/40 font-cinzel">Summoning</span>
        </div>
      )}
    </button>
  );
}
