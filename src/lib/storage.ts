import type { Collection, Loadout } from '@/types';
import { getStarterCollection } from '@/data/cards';

// v2: card set replaced by the Chord Casters rules (docs/rules.md); older saves reference removed cards
const COLLECTION_KEY = 'spirit-chord:collection:v2';
const LOADOUT_KEY = 'spirit-chord:loadout:v2';

// ─── Collection ───────────────────────────────────────────────────────────────
export function loadCollection(): Collection {
  if (typeof window === 'undefined') return defaultCollection();
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return defaultCollection();
    return JSON.parse(raw) as Collection;
  } catch {
    return defaultCollection();
  }
}

export function saveCollection(col: Collection): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(col));
}

function defaultCollection(): Collection {
  return {
    cardCounts: getStarterCollection(),
    unlockedMusicians: ['musician-sunslinger', 'musician-resonant'],
    unlockedInstruments: ['instrument-southern-belle', 'instrument-minor-mandate', 'instrument-excalibur'],
  };
}

export function ensureCollection(): Collection {
  const col = loadCollection();
  // Make sure starter cards are present
  const starter = getStarterCollection();
  let changed = false;
  for (const [id, count] of Object.entries(starter)) {
    if (!col.cardCounts[id]) {
      col.cardCounts[id] = count;
      changed = true;
    }
  }
  if (changed) saveCollection(col);
  return col;
}

// ─── Loadout ──────────────────────────────────────────────────────────────────
export function loadLoadout(): Loadout | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOADOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Loadout;
  } catch {
    return null;
  }
}

export function saveLoadout(loadout: Loadout): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOADOUT_KEY, JSON.stringify(loadout));
}

export function getDefaultLoadout(): Loadout {
  const { STARTER_DECK_IDS } = require('@/data/cards');
  return {
    musicianId: 'musician-sunslinger',
    instrumentId: 'instrument-southern-belle',
    deckCardIds: STARTER_DECK_IDS,
  };
}

// ─── Add cards to collection (after winning) ──────────────────────────────────
export function addCardsToCollection(cardIds: string[]): void {
  const col = loadCollection();
  for (const id of cardIds) {
    col.cardCounts[id] = (col.cardCounts[id] ?? 0) + 1;
  }
  saveCollection(col);
}
