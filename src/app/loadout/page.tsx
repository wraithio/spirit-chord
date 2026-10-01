'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MUSICIANS, INSTRUMENTS, ALL_CARDS, STARTER_DECK_IDS } from '@/data/cards';
import { loadCollection, saveLoadout } from '@/lib/storage';
import { DECK_MIN, DECK_MAX } from '@/lib/rules';
import type { MusicianCard, InstrumentCard, AnyCard, Collection } from '@/types';
import clsx from 'clsx';

export default function LoadoutPage() {
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [selectedMusician, setSelectedMusician] = useState<MusicianCard>(MUSICIANS[0]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentCard>(INSTRUMENTS[0]);
  const [deck, setDeck] = useState<string[]>(STARTER_DECK_IDS);
  const [tab, setTab] = useState<'musician' | 'instrument' | 'deck'>('musician');

  useEffect(() => {
    const col = loadCollection();
    setCollection(col);
  }, []);

  const handleStart = () => {
    saveLoadout({ musicianId: selectedMusician.id, instrumentId: selectedInstrument.id, deckCardIds: deck });
    router.push('/game');
  };

  const availableMusicians = MUSICIANS.filter(m =>
    !collection || collection.unlockedMusicians.includes(m.id)
  );
  const availableInstruments = INSTRUMENTS.filter(i =>
    !collection || collection.unlockedInstruments.includes(i.id)
  );

  const deckCards = deck.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as AnyCard[];
  const deckValid = deck.length >= DECK_MIN && deck.length <= DECK_MAX;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #04040f, #080818, #0d0d2b)' }}
    >
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-4 flex items-center gap-6">
        <button
          onClick={() => router.push('/')}
          className="font-cinzel text-white/30 hover:text-white/70 transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="font-cinzel font-bold text-gold-400 text-xl tracking-wide">
          LOADOUT SELECTION
        </h1>
        <div className="flex-1" />
        <button
          onClick={handleStart}
          disabled={!deckValid}
          className={clsx(
            'px-8 py-3 rounded-xl font-cinzel font-bold text-sm border-2 transition-all',
            deckValid
              ? 'border-gold-500 text-gold-400 hover:bg-gold-500/10 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer'
              : 'border-white/10 text-white/20 cursor-not-allowed'
          )}
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          ⚔ Begin Battle
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/5 px-8">
        {(['musician', 'instrument', 'deck'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'font-cinzel text-sm px-6 py-3 border-b-2 transition-all capitalize',
              tab === t
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-white/30 hover:text-white/60'
            )}
          >
            {t === 'musician' ? '♜ Musician' : t === 'instrument' ? '♪ Instrument' : '♖ Deck'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {tab === 'musician' && (
          <div>
            <p className="font-crimson text-white/40 italic mb-6 text-lg">
              Choose your Musician — your hero with unique abilities and HP.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableMusicians.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMusician(m)}
                  className={clsx(
                    'rounded-2xl border-2 p-6 text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer',
                    selectedMusician.id === m.id
                      ? 'border-gold-500 shadow-[0_0_24px_rgba(212,175,55,0.4)]'
                      : 'border-white/10 hover:border-white/25'
                  )}
                  style={{ background: m.artGradient }}
                >
                  <div className="font-cinzel font-bold text-white text-xl mb-1">{m.name}</div>
                  <div className="font-cinzel text-white/50 text-sm mb-4">{m.subtitle}</div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-red-400 font-cinzel font-bold">♥ {m.hp} HP</div>
                    <div className={clsx(
                      'text-xs font-cinzel px-2 py-0.5 rounded',
                      m.abilityType === 'active' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'
                    )}>
                      {m.abilityType}
                    </div>
                  </div>
                  <p className="font-crimson text-white/60 text-sm leading-relaxed">{m.abilityText}</p>
                  {selectedMusician.id === m.id && (
                    <div className="mt-4 text-gold-400 font-cinzel text-sm">✓ Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'instrument' && (
          <div>
            <p className="font-crimson text-white/40 italic mb-6 text-lg">
              Choose your Combat Instrument — its scale sets the notes in your reserve (4 of each).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableInstruments.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstrument(inst)}
                  className={clsx(
                    'rounded-2xl border-2 p-6 text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer',
                    selectedInstrument.id === inst.id
                      ? 'border-gold-500 shadow-[0_0_24px_rgba(212,175,55,0.4)]'
                      : 'border-white/10 hover:border-white/25'
                  )}
                  style={{ background: inst.artGradient }}
                >
                  <div className="font-cinzel font-bold text-white text-xl mb-1">{inst.name}</div>
                  <div className="font-cinzel text-white/50 text-sm mb-2">{inst.subtype}</div>
                  <div className="font-cinzel text-gold-400/80 text-sm mb-3">Key: {inst.allowedKey}</div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {inst.allowedNotes.map(n => (
                      <span key={n} className="font-cinzel text-xs bg-black/40 rounded px-1.5 py-0.5 text-white/70 border border-white/10">
                        {n}
                      </span>
                    ))}
                  </div>
                  <p className="font-crimson text-white/60 text-sm leading-relaxed">{inst.abilityText}</p>
                  {selectedInstrument.id === inst.id && (
                    <div className="mt-4 text-gold-400 font-cinzel text-sm">✓ Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'deck' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="font-crimson text-white/40 italic text-lg">
                Your deck: {deck.length} cards ({DECK_MIN}–{DECK_MAX} required, max 1 song spirit)
              </p>
              <button
                onClick={() => setDeck([...STARTER_DECK_IDS])}
                className="font-cinzel text-sm text-white/40 hover:text-white/70 border border-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                Reset to Starter
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ALL_CARDS.map(card => {
                const owned = collection?.cardCounts[card.id] ?? 0;
                const inDeck = deck.filter(id => id === card.id).length;
                const canAdd = inDeck < owned && deck.length < DECK_MAX && !(card.type === 'song-spirit' && inDeck >= 1);
                const canRemove = inDeck > 0;
                if (owned === 0) return null;

                return (
                  <div
                    key={card.id}
                    className="rounded-xl border border-white/10 p-3 flex flex-col gap-2"
                    style={{ background: card.artGradient }}
                  >
                    <div className="font-cinzel font-bold text-white text-xs leading-tight">{card.name}</div>
                    <div className="font-cinzel text-white/40 text-xs">{card.romanNumeral}</div>
                    <div className="flex items-center gap-1 mt-auto">
                      <button
                        onClick={() => canRemove && setDeck(d => {
                          const i = d.lastIndexOf(card.id);
                          return i !== -1 ? [...d.slice(0, i), ...d.slice(i + 1)] : d;
                        })}
                        disabled={!canRemove}
                        className={clsx(
                          'w-6 h-6 rounded font-cinzel font-bold text-sm transition-colors',
                          canRemove ? 'bg-red-900/60 text-red-300 hover:bg-red-900' : 'opacity-20 cursor-not-allowed'
                        )}
                      >
                        −
                      </button>
                      <span className="font-cinzel text-white font-bold text-sm flex-1 text-center">
                        {inDeck}/{owned}
                      </span>
                      <button
                        onClick={() => canAdd && setDeck(d => [...d, card.id])}
                        disabled={!canAdd}
                        className={clsx(
                          'w-6 h-6 rounded font-cinzel font-bold text-sm transition-colors',
                          canAdd ? 'bg-green-900/60 text-green-300 hover:bg-green-900' : 'opacity-20 cursor-not-allowed'
                        )}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected loadout summary */}
      <div className="border-t border-white/5 px-8 py-4 flex items-center gap-6">
        <div className="font-cinzel text-white/30 text-xs">
          <span className="text-gold-400/60">Musician:</span> {selectedMusician.name}
        </div>
        <div className="font-cinzel text-white/30 text-xs">
          <span className="text-gold-400/60">Instrument:</span> {selectedInstrument.name} ({selectedInstrument.allowedKey})
        </div>
        <div className="font-cinzel text-white/30 text-xs">
          <span className="text-gold-400/60">Deck:</span> {deck.length} cards
          {!deckValid && <span className="text-red-400 ml-1">(need {DECK_MIN}–{DECK_MAX})</span>}
        </div>
      </div>
    </div>
  );
}
