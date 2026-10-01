'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GameBoard from '@/components/game/GameBoard';
import { loadLoadout, getDefaultLoadout, addCardsToCollection } from '@/lib/storage';
import { MUSICIANS, INSTRUMENTS, buildDeckFromIds, getStarterDeck } from '@/data/cards';
import { DECK_MIN } from '@/lib/rules';
import type { MusicianCard, InstrumentCard, AnyCard } from '@/types';

export default function GamePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [musician, setMusician] = useState<MusicianCard | null>(null);
  const [instrument, setInstrument] = useState<InstrumentCard | null>(null);
  const [deck, setDeck] = useState<AnyCard[]>([]);

  useEffect(() => {
    const loadout = loadLoadout() ?? getDefaultLoadout();
    const m = MUSICIANS.find(x => x.id === loadout.musicianId) ?? MUSICIANS[0];
    const i = INSTRUMENTS.find(x => x.id === loadout.instrumentId) ?? INSTRUMENTS[0];
    const d = buildDeckFromIds(loadout.deckCardIds);
    setMusician(m);
    setInstrument(i);
    setDeck(d.length >= DECK_MIN ? d : getStarterDeck());
    setReady(true);
  }, []);

  const handleGameOver = (winner: 'player' | 'ai') => {
    if (winner === 'player') {
      // Award 2 random cards from the pool on win (copy first: sort() would reorder the shared ALL_CARDS)
      const { ALL_CARDS } = require('@/data/cards');
      const rewards = [...ALL_CARDS].sort(() => Math.random() - 0.5).slice(0, 2).map((c: AnyCard) => c.id);
      addCardsToCollection(rewards);
    }
  };

  if (!ready || !musician || !instrument) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#080818' }}
      >
        <div className="text-center">
          <div
            className="font-cinzel text-4xl mb-4 animate-pulse"
            style={{ color: '#d4af37' }}
          >
            ♫
          </div>
          <div className="font-cinzel text-white/40 text-sm tracking-widest">
            TUNING THE SPIRITS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameBoard
      playerMusician={musician}
      playerInstrument={instrument}
      playerDeck={deck}
      onGameOver={handleGameOver}
    />
  );
}
