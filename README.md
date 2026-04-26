# 🎵 Spirit Chord — Music Theory Card Game

A digital trading card game built with **Next.js 14** where music theory is the core mechanic.

## Game Concept

- **Note Spirits** — Your resources. Play 1 per turn from the chromatic scale.
- **Chord Spirits** — Fighters summoned by combining Note Spirits on the field.
- **Chord Progression Spirits** — Powerful ultimates formed from multiple Chord Spirits.
- **Song Spells** — Instant effects, paid with specific notes on the field.

All chord combinations follow **strict music theory rules** (C + E + G = C Major, etc.) and trigger **real piano audio** when played.

---

## Setup (VS Code)

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Navigate to the project folder
cd spirit-chord

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Main menu
│   ├── loadout/          # Musician + Instrument + Deck selection
│   ├── game/             # The battle board
│   └── collection/       # Card collection viewer
├── components/
│   ├── cards/            # NoteCard, ChordCard, HandCard, FieldSpiritCard
│   └── game/             # GameBoard (main game UI)
├── data/
│   └── cards.ts          # All card definitions (Chord Spirits, Spells, Progressions)
├── lib/
│   ├── musicTheory.ts    # Chord validation, note frequencies
│   ├── audioEngine.ts    # Web Audio API piano synthesis
│   ├── gameEngine.ts     # Game state reducer
│   ├── aiOpponent.ts     # Rule-based AI
│   └── storage.ts        # localStorage persistence
└── types/
    └── index.ts          # All TypeScript types
```

---

## How to Play

1. **Loadout** — Pick your Musician (hero), Combat Instrument (key/deck rules), and build your 20–30 card deck.
2. **Draw Phase** — Draw 1 card at the start of your turn.
3. **Note Phase** — Choose any 1 Note Spirit to place on your battlefield.
4. **Main Phase** — Play Chord Spirits (spending the matching notes), Spells, or Chord Progressions.
5. **Attack Phase** — Chord Spirits can challenge enemy spirits or the enemy hero directly.
6. **End Turn** — Pass to the opponent.

**Win by reducing the enemy Musician's HP to 0!**

---

## Music Theory Engine

The game enforces real chord theory. Cards list required notes on their left spine:

| Card | Required Notes | Chord |
|------|---------------|-------|
| Fanfare Falcon | D, F, A | D Minor (ii) |
| Dominant Dragon | G, B, D | G Major (V) |
| Accidental Alligator | D, F, A, C | D Minor 7th (ii⁷) |

---

## Card Rarity

- **Common** — White border
- **Uncommon** — Silver glow
- **Rare** — Purple glow  
- **Legendary** — Gold shimmer effect

---

## Extending the Game

To add new cards, edit `src/data/cards.ts` and add entries to:
- `CHORD_SPIRIT_CARDS` — for new Chord Spirits
- `SONG_SPELL_CARDS` — for new spells  
- `CHORD_PROGRESSION_CARDS` — for new ultimates

Cards are automatically picked up by the collection system and deck builder.
