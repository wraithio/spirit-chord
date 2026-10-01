import clsx from 'clsx';
import React from 'react'

// Opens the note picker; shows how many of this turn's 3 notes are left
interface SelectNoteCardProps {
  onClick: () => void;
  enabled: boolean;
  remaining: number;
}

export function SelectNoteCard ({ onClick, enabled, remaining }: SelectNoteCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      className={clsx(
        'relative rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none w-24 h-20',
        enabled ? 'border-green-400/60 hover:scale-102 hover:-translate-y-0.5 cursor-pointer' : 'border-white/10 opacity-40 cursor-not-allowed',
      )}
      style={{
        background: 'rgba(0,0,0,0.5)',
        boxShadow: enabled ? '0 0 12px rgba(74,222,128,0.4)' : 'none',
      }}
    >
      <span className="font-cinzel text-white/30 text-2xl leading-none">♩</span>
      <span className="font-cinzel font-bold text-white text-xs mt-1">Add Notes</span>
      <span className="font-cinzel text-green-300/80 text-[10px]">{remaining} left this turn</span>
    </button>
  )
}

export default SelectNoteCard
