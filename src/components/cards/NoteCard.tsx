'use client';
import type { NoteId, NoteSpiritDef } from '@/types';
import clsx from 'clsx';

interface Props {
  note: NoteSpiritDef;
  isSelected?: boolean;
  isOnField?: boolean;
  isAvailable?: boolean;
  chosenNote?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function NoteCard({
  note, isSelected, isOnField, isAvailable = true, chosenNote, onClick, size = 'md',
}: Props) {
  const displayLabel = chosenNote ?? note.primaryNote;

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-14 h-20 text-sm',
    lg: 'w-16 h-24 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable && !isOnField}
      className={clsx(
        'relative rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-200 font-cinzel font-bold select-none',
        sizeClasses[size],
        isSelected && 'scale-110 border-gold-400 shadow-[0_0_16px_rgba(212,175,55,0.8)]',
        isOnField && !isSelected && 'border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]',
        !isOnField && !isSelected && isAvailable && 'border-white/20 hover:border-white/50 hover:scale-105 cursor-pointer',
        !isAvailable && !isOnField && 'opacity-40 cursor-not-allowed border-white/10',
      )}
      style={{
        background: isOnField
          ? `linear-gradient(135deg, #0d1b2a 0%, #1a2a4a 100%)`
          : isSelected
          ? `linear-gradient(135deg, #1a1200 0%, #3a2800 100%)`
          : `linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)`,
        boxShadow: isSelected
          ? `0 0 20px ${note.color}80, inset 0 0 10px ${note.color}20`
          : isOnField
          ? `0 0 10px rgba(96,165,250,0.3)`
          : undefined,
      }}
      title={note.displayName}
    >
      {/* Color dot */}
      <div
        className="w-2 h-2 rounded-full mb-1"
        style={{ backgroundColor: note.color, boxShadow: `0 0 6px ${note.color}` }}
      />

      {/* Note name */}
      <span
        className="leading-none"
        style={{ color: isSelected ? '#d4af37' : isOnField ? '#93c5fd' : '#e2e8f0', fontSize: size === 'sm' ? '0.7rem' : '0.85rem' }}
      >
        {displayLabel}
      </span>

      {/* Alternate name */}
      {note.altNote !== note.primaryNote && size !== 'sm' && (
        <span className="text-white/30 mt-0.5" style={{ fontSize: '0.55rem' }}>
          {note.altNote}
        </span>
      )}

      {/* On field indicator */}
      {isOnField && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 border border-blue-200" />
      )}

      {/* Selected glow ring */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{ boxShadow: `inset 0 0 8px ${note.color}60` }}
        />
      )}
    </button>
  );
}
