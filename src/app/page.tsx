'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureCollection } from '@/lib/storage';

const FLOATING_NOTES = ['♩', '♪', '♫', '♬', '𝄞', '𝄢'];

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    ensureCollection(); // init localStorage on first visit
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #04040f 0%, #080818 40%, #0d0d2b 100%)' }}
    >
      {/* Animated floating notes */}
      {mounted && FLOATING_NOTES.map((note, i) => (
        <div
          key={i}
          className="absolute text-gold-500/10 select-none pointer-events-none font-cinzel"
          style={{
            fontSize: `${2 + Math.random() * 3}rem`,
            left: `${10 + i * 15}%`,
            top: `${Math.random() * 80}%`,
            animation: `noteRain ${8 + i * 2}s linear ${i * 1.5}s infinite`,
          }}
        >
          {note}
        </div>
      ))}

      {/* Radial glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(157,78,221,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Staff lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[35, 42, 49, 56, 63].map(pos => (
          <div
            key={pos}
            className="absolute w-full h-px"
            style={{ top: `${pos}%`, background: 'rgba(255,255,255,0.03)' }}
          />
        ))}
      </div>

      {/* Logo area */}
      <div className="relative z-10 text-center mb-16">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4))' }} />
          <span className="font-cinzel text-gold-500/60 text-sm tracking-[0.3em]">EST. 2024</span>
          <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.4))' }} />
        </div>

        <h1
          className="font-cinzel font-black text-7xl mb-2 leading-none"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f0c040 40%, #d4af37 70%, #b8960c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.4))',
          }}
        >
          SPIRIT
        </h1>
        <h2
          className="font-cinzel font-bold text-5xl tracking-[0.2em]"
          style={{ color: '#9d4edd', filter: 'drop-shadow(0 0 20px rgba(157,78,221,0.6))' }}
        >
          CHORD
        </h2>
        <p className="font-crimson text-white/40 text-xl mt-4 italic tracking-wide">
          Build chords. Create progressions. Command the sound.
        </p>
      </div>

      {/* Menu buttons */}
      <div className="relative z-10 flex flex-col gap-4 w-64">
        <MenuButton
          label="⚔ Play vs AI"
          subtitle="Single player battle"
          primary
          onClick={() => router.push('/loadout')}
        />
        <MenuButton
          label="♟ Local Multiplayer"
          subtitle="Same device, two players"
          onClick={() => router.push('/loadout?mode=local')}
        />
        <MenuButton
          label="♩ Collection"
          subtitle="Manage your cards"
          onClick={() => router.push('/collection')}
        />
      </div>

      {/* How to play hint */}
      <div
        className="relative z-10 mt-16 border border-white/5 rounded-xl p-6 max-w-md mx-4"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      >
        <h3 className="font-cinzel text-gold-400/80 text-sm font-bold tracking-wider mb-3 text-center">
          HOW TO PLAY
        </h3>
        <div className="space-y-2 font-crimson text-white/50 text-sm">
          <p><span className="text-gold-400/70">1.</span> Play 1 Note Spirit per turn to build your chord</p>
          <p><span className="text-gold-400/70">2.</span> Combine notes into Chord Spirits to summon fighters</p>
          <p><span className="text-gold-400/70">3.</span> Stack Chord Spirits into powerful Chord Progressions</p>
          <p><span className="text-gold-400/70">4.</span> Reduce the enemy Musician's HP to 0 to win!</p>
        </div>
      </div>

      <div className="absolute bottom-4 font-cinzel text-white/20 text-xs tracking-widest">
        Spirit Chord v0.1 · Music Theory Card Game
      </div>
    </div>
  );
}

function MenuButton({
  label, subtitle, primary, onClick,
}: {
  label: string; subtitle?: string; primary?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl border-2 px-6 py-4 text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      style={{
        borderColor: primary ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)',
        background: primary
          ? 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(157,78,221,0.05))'
          : 'rgba(0,0,0,0.4)',
        boxShadow: primary ? '0 0 24px rgba(212,175,55,0.15)' : undefined,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = primary ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.25)';
        (e.currentTarget as HTMLElement).style.boxShadow = primary
          ? '0 0 32px rgba(212,175,55,0.3)'
          : '0 0 16px rgba(255,255,255,0.05)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = primary ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)';
        (e.currentTarget as HTMLElement).style.boxShadow = primary ? '0 0 24px rgba(212,175,55,0.15)' : '';
      }}
    >
      <div
        className="font-cinzel font-bold text-base"
        style={{ color: primary ? '#d4af37' : '#e2e8f0' }}
      >
        {label}
      </div>
      {subtitle && (
        <div className="font-crimson text-white/35 text-sm mt-0.5">{subtitle}</div>
      )}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 font-cinzel opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: primary ? '#d4af37' : '#fff' }}
      >
        →
      </div>
    </button>
  );
}
