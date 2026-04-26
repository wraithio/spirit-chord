'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureCollection } from '@/lib/storage';
import { ALL_CARDS, MUSICIANS, INSTRUMENTS } from '@/data/cards';
import type { Collection, AnyCard } from '@/types';
import clsx from 'clsx';

type FilterType = 'all' | 'chord-spirit' | 'song-spell' | 'chord-progression';

export default function CollectionPage() {
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCollection(ensureCollection());
  }, []);

  const ownedCards = ALL_CARDS.filter(c => (collection?.cardCounts[c.id] ?? 0) > 0);
  const filtered = ownedCards.filter(c => {
    if (filter !== 'all' && c.type !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalOwned = Object.values(collection?.cardCounts ?? {}).reduce((a, b) => a + b, 0);

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
          CARD COLLECTION
        </h1>
        <div className="font-cinzel text-white/30 text-sm ml-auto">
          {totalOwned} cards owned · {ownedCards.length} unique
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'chord-spirit', 'song-spell', 'chord-progression'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'font-cinzel text-xs px-4 py-2 rounded-lg border transition-all',
                filter === f
                  ? 'border-gold-500 text-gold-400 bg-gold-500/10'
                  : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'
              )}
            >
              {f === 'all' ? 'All' : f === 'chord-spirit' ? 'Chord Spirits' : f === 'song-spell' ? 'Song Spells' : 'Progressions'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto font-cinzel text-sm bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white/70 focus:outline-none focus:border-gold-500/50 placeholder:text-white/20"
        />
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filtered.map(card => {
            const count = collection?.cardCounts[card.id] ?? 0;
            const isChord = card.type === 'chord-spirit';
            const isProg = card.type === 'chord-progression';
            const cs = isChord ? card as import('@/types').ChordSpiritCard : null;
            const cp = isProg ? card as import('@/types').ChordProgressionCard : null;

            return (
              <div
                key={card.id}
                className="relative rounded-xl border border-white/10 overflow-hidden flex flex-col transition-all hover:scale-[1.03] hover:border-white/25"
                style={{ background: card.artGradient, minHeight: '180px' }}
              >
                {/* Header */}
                <div className="px-2 pt-2 pb-1 bg-black/60">
                  <div className="font-cinzel font-bold text-white leading-tight" style={{ fontSize: '0.65rem' }}>
                    {card.name}
                  </div>
                  <div className="font-cinzel text-white/40 mt-0.5" style={{ fontSize: '0.5rem' }}>
                    {card.type === 'chord-spirit' ? 'Chord Spirit' : card.type === 'song-spell' ? 'Song Spell' : 'Chord Progression'}
                  </div>
                </div>

                {/* Notes required */}
                <div className="px-2 py-1 flex flex-wrap gap-0.5 bg-black/30">
                  {card.requiredNotes.map((n, i) => (
                    <span key={i} className="font-cinzel text-white/70 font-bold" style={{ fontSize: '0.6rem' }}>{n}</span>
                  ))}
                  {card.type === 'chord-progression' && (
                    <span className="font-cinzel text-gold-400/60" style={{ fontSize: '0.5rem' }}>
                      Chord Prog
                    </span>
                  )}
                </div>

                {/* Art */}
                <div className="flex-1 flex items-center justify-center py-2">
                  <span className="text-white/10 text-4xl font-cinzel">
                    {card.type === 'song-spell' ? '♪' : card.type === 'chord-progression' ? '♫' : '♩'}
                  </span>
                </div>

                {/* Stats */}
                <div className="px-2 pb-2 bg-black/60">
                  {(isChord || (isProg && cp?.isMinion)) && (
                    <div className="flex gap-2 mb-1">
                      <span className="text-orange-400 font-cinzel font-bold" style={{ fontSize: '0.65rem' }}>
                        {cs?.strength ?? cp?.strength ?? 0}⚔
                      </span>
                      <span className="text-blue-400 font-cinzel font-bold" style={{ fontSize: '0.65rem' }}>
                        {cs?.will ?? cp?.will ?? 0}🛡
                      </span>
                    </div>
                  )}
                  <p className="text-white/50 leading-tight" style={{ fontSize: '0.5rem' }}>
                    {card.abilityText.slice(0, 60)}{card.abilityText.length > 60 ? '...' : ''}
                  </p>
                </div>

                {/* Roman numeral */}
                <div className="absolute top-2 right-2 font-cinzel text-white/20 font-bold" style={{ fontSize: '0.55rem' }}>
                  {card.romanNumeral}
                </div>

                {/* Count badge */}
                <div
                  className="absolute bottom-2 right-2 rounded-full w-5 h-5 flex items-center justify-center font-cinzel font-bold text-xs"
                  style={{ background: '#d4af37', color: '#000' }}
                >
                  {count}
                </div>

                {/* Rarity glow */}
                {card.rarity === 'legendary' && (
                  <div className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{ boxShadow: 'inset 0 0 20px rgba(212,175,55,0.2)' }} />
                )}
                {card.rarity === 'rare' && (
                  <div className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{ boxShadow: 'inset 0 0 12px rgba(157,78,221,0.2)' }} />
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="font-cinzel text-4xl text-white/10 mb-4">♩</div>
            <div className="font-cinzel text-white/20 text-lg">No cards found</div>
            <div className="font-crimson text-white/15 italic mt-2">Try a different filter</div>
          </div>
        )}
      </div>

      {/* Musicians & Instruments section */}
      <div className="border-t border-white/5 px-8 py-6">
        <h2 className="font-cinzel text-gold-400/60 text-sm tracking-wider mb-4">UNLOCKED MUSICIANS & INSTRUMENTS</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {MUSICIANS.filter(m => collection?.unlockedMusicians.includes(m.id)).map(m => (
            <div
              key={m.id}
              className="flex-none rounded-xl border border-white/10 p-4 min-w-[160px]"
              style={{ background: m.artGradient }}
            >
              <div className="font-cinzel font-bold text-white text-sm">{m.name}</div>
              <div className="font-cinzel text-white/40 text-xs mb-2">{m.subtitle}</div>
              <div className="text-red-400 font-cinzel text-xs">♥ {m.hp} HP</div>
            </div>
          ))}
          {INSTRUMENTS.filter(i => collection?.unlockedInstruments.includes(i.id)).map(inst => (
            <div
              key={inst.id}
              className="flex-none rounded-xl border border-white/10 p-4 min-w-[160px]"
              style={{ background: inst.artGradient }}
            >
              <div className="font-cinzel font-bold text-white text-sm">{inst.name}</div>
              <div className="font-cinzel text-white/40 text-xs mb-2">{inst.subtype}</div>
              <div className="text-gold-400/60 font-cinzel text-xs">Key: {inst.allowedKey}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
