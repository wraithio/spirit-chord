'use client';
import type { NoteDef } from '@/types';

// ─── A note in a player's pool (untapped count, plus how many are tapped) ────
interface Props {
  note: NoteDef;
  untapped: number;
  tapped: number;
}

export default function NoteCard({ note, untapped, tapped }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-0.5"
      title={`${note.name}: ${untapped} untapped, ${tapped} tapped`}
    >
      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center font-cinzel font-bold text-black text-sm transition-opacity"
        style={{
          backgroundColor: note.color,
          opacity: untapped > 0 ? 1 : 0.3,
          boxShadow: untapped > 0 ? `0 0 8px ${note.color}` : 'none',
        }}
      >
        {note.primaryNote}
        {untapped > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/40 text-white text-[10px] flex items-center justify-center">
            {untapped}
          </span>
        )}
      </div>
      <span className="font-cinzel text-[10px] text-white/35 h-3">{tapped > 0 ? `${tapped} tapped` : ''}</span>
    </div>
  );
}
