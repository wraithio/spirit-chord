'use client';

import { NOTE_MAP } from './musicTheory';
import type { NoteId } from '@/types';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

// ─── Piano synthesis ──────────────────────────────────────────────────────────
function playFrequency(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number = 1.8,
  volume: number = 0.25
): void {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Attack / Decay / Sustain / Release envelope
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
  masterGain.gain.exponentialRampToValueAtTime(volume * 0.7, startTime + 0.1);
  masterGain.gain.exponentialRampToValueAtTime(volume * 0.5, startTime + 0.4);
  masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  // Low-pass filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000;
  filter.Q.value = 0.5;
  filter.connect(masterGain);

  // Harmonic series (simulating piano strings)
  const harmonics = [
    { ratio: 1,   gainMult: 1.0  },
    { ratio: 2,   gainMult: 0.4  },
    { ratio: 3,   gainMult: 0.2  },
    { ratio: 4,   gainMult: 0.1  },
    { ratio: 5,   gainMult: 0.05 },
  ];

  harmonics.forEach(({ ratio, gainMult }) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(filter);

    osc.type = ratio === 1 ? 'triangle' : 'sine';
    osc.frequency.value = frequency * ratio;
    oscGain.gain.value = gainMult;

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });

  // Slight second oscillator detuned for richness
  const osc2 = ctx.createOscillator();
  const osc2Gain = ctx.createGain();
  osc2.connect(osc2Gain);
  osc2Gain.connect(filter);
  osc2.type = 'sine';
  osc2.frequency.value = frequency * 1.002; // slight detune
  osc2Gain.gain.value = 0.15;
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.1);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function playNote(noteId: NoteId): void {
  try {
    const ctx = getCtx();
    const noteDef = NOTE_MAP[noteId];
    if (!noteDef) return;
    playFrequency(ctx, noteDef.frequency, ctx.currentTime);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playNoteByName(noteName: string): void {
  try {
    const ctx = getCtx();
    // Find frequency by note name
    const noteDef = Object.values(NOTE_MAP).find(
      n => n.primaryNote === noteName || n.altNote === noteName
    );
    if (!noteDef) return;
    playFrequency(ctx, noteDef.frequency, ctx.currentTime);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playChord(noteNames: string[], arpeggiate: boolean = false): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    noteNames.forEach((name, i) => {
      const noteDef = Object.values(NOTE_MAP).find(
        n => n.primaryNote === name || n.altNote === name
      );
      if (!noteDef) return;
      const delay = arpeggiate ? i * 0.08 : 0;
      playFrequency(ctx, noteDef.frequency, now + delay, 2.5, 0.2);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playChordProgression(chords: string[][]): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const chordDuration = 1.2;

    chords.forEach((chord, chordIdx) => {
      chord.forEach((noteName) => {
        const noteDef = Object.values(NOTE_MAP).find(
          n => n.primaryNote === noteName || n.altNote === noteName
        );
        if (!noteDef) return;
        playFrequency(ctx, noteDef.frequency, now + chordIdx * chordDuration, chordDuration * 0.9, 0.18);
      });
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playVictoryFanfare(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Simple ascending I-IV-V-I progression
    const fanfare = [
      [261.63, 329.63, 392.00], // C major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99], // C major (octave up)
    ];
    fanfare.forEach((chord, i) => {
      chord.forEach(freq => {
        playFrequency(ctx, freq, now + i * 0.5, 0.8, 0.22);
      });
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playDefeatSound(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Descending minor passage
    [440, 415.30, 392, 369.99, 349.23].forEach((freq, i) => {
      playFrequency(ctx, freq, now + i * 0.25, 0.6, 0.2);
    });
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playCardPlace(): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Soft thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function resumeAudioContext(): void {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
}
