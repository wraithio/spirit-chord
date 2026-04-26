import type { NoteId, NoteSpiritDef } from '@/types';

// ─── Note definitions ────────────────────────────────────────────────────────
export const NOTE_SPIRITS: NoteSpiritDef[] = [
  { id: 'Cs', displayName: 'C#/Db',  primaryNote: 'C#', altNote: 'Db', semitone: 1,  frequency: 277.18, color: '#e67e22', strength: 1, will: 1 },
  { id: 'C',  displayName: 'C',      primaryNote: 'C',  altNote: 'B#', semitone: 0,  frequency: 261.63, color: '#e74c3c', strength: 1, will: 1 },
  { id: 'D',  displayName: 'D',      primaryNote: 'D',  altNote: 'D',  semitone: 2,  frequency: 293.66, color: '#f1c40f', strength: 1, will: 1 },
  { id: 'Ds', displayName: 'D#/Eb',  primaryNote: 'D#', altNote: 'Eb', semitone: 3,  frequency: 311.13, color: '#2ecc71', strength: 1, will: 1 },
  { id: 'E',  displayName: 'E',      primaryNote: 'E',  altNote: 'Fb', semitone: 4,  frequency: 329.63, color: '#1abc9c', strength: 1, will: 1 },
  { id: 'F',  displayName: 'F',      primaryNote: 'F',  altNote: 'E#', semitone: 5,  frequency: 349.23, color: '#3498db', strength: 1, will: 1 },
  { id: 'Fs', displayName: 'F#/Gb',  primaryNote: 'F#', altNote: 'Gb', semitone: 6,  frequency: 369.99, color: '#9b59b6', strength: 1, will: 1 },
  { id: 'G',  displayName: 'G',      primaryNote: 'G',  altNote: 'G',  semitone: 7,  frequency: 392.00, color: '#e91e63', strength: 1, will: 1 },
  { id: 'Gs', displayName: 'G#/Ab',  primaryNote: 'G#', altNote: 'Ab', semitone: 8,  frequency: 415.30, color: '#ff5722', strength: 1, will: 1 },
  { id: 'A',  displayName: 'A',      primaryNote: 'A',  altNote: 'A',  semitone: 9,  frequency: 440.00, color: '#00bcd4', strength: 1, will: 1 },
  { id: 'As', displayName: 'A#/Bb',  primaryNote: 'A#', altNote: 'Bb', semitone: 10, frequency: 466.16, color: '#8bc34a', strength: 1, will: 1 },
  { id: 'B',  displayName: 'B',      primaryNote: 'B',  altNote: 'Cb', semitone: 11, frequency: 493.88, color: '#ff9800', strength: 1, will: 1 },
];

export const NOTE_MAP = Object.fromEntries(NOTE_SPIRITS.map(n => [n.id, n])) as Record<NoteId, NoteSpiritDef>;

// ─── Semitone lookup ─────────────────────────────────────────────────────────
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

export function noteToSemitone(note: string): number {
  return NOTE_TO_SEMITONE[note] ?? -1;
}

// ─── Chord patterns (intervals from root) ────────────────────────────────────
export const CHORD_PATTERNS: Record<string, number[]> = {
  'Major':            [0, 4, 7],
  'Minor':            [0, 3, 7],
  'Diminished':       [0, 3, 6],
  'Augmented':        [0, 4, 8],
  'Suspended 2nd':    [0, 2, 7],
  'Suspended 4th':    [0, 5, 7],
  'Major 7th':        [0, 4, 7, 11],
  'Minor 7th':        [0, 3, 7, 10],
  'Dominant 7th':     [0, 4, 7, 10],
  'Diminished 7th':   [0, 3, 6, 9],
  'Half Diminished':  [0, 3, 6, 10],
  'Major 9th':        [0, 2, 4, 7, 11],
  'Minor 9th':        [0, 2, 3, 7, 10],
};

export interface ChordResult {
  root: string;
  quality: string;
  fullName: string;
  semitones: number[];
}

function arraysMatch(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function identifyChord(notes: string[]): ChordResult | null {
  if (notes.length < 3) return null;

  const semitones = notes.map(noteToSemitone).filter(s => s >= 0);
  const unique = [...new Set(semitones)];

  // Try each note as potential root
  for (const rootSemitone of unique) {
    const intervals = unique
      .map(s => ((s - rootSemitone) + 12) % 12)
      .sort((a, b) => a - b);

    for (const [quality, pattern] of Object.entries(CHORD_PATTERNS)) {
      if (arraysMatch(intervals, pattern)) {
        // Find root note name
        const rootEntry = NOTE_SPIRITS.find(n => n.semitone === rootSemitone);
        const root = rootEntry?.primaryNote ?? '?';
        return { root, quality, fullName: `${root} ${quality}`, semitones };
      }
    }
  }
  return null;
}

// ─── Check if a set of notes on the field can play a specific card ───────────
export function canPlayCard(requiredNotes: string[], fieldNotes: string[]): boolean {
  const required = [...requiredNotes];
  const available = [...fieldNotes];
  for (const note of required) {
    const idx = available.findIndex(n => noteToSemitone(n) === noteToSemitone(note));
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

// ─── C Major key definition ──────────────────────────────────────────────────
export const C_MAJOR_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const A_MINOR_NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// ─── Chord progression validation ────────────────────────────────────────────
export function validateProgression(chordNames: string[]): boolean {
  // For now: valid if it contains known musical progressions
  // This is a placeholder — expand as more progressions are added
  return chordNames.length >= 2;
}
