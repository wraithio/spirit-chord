# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-player (vs. AI) trading card game where music theory is the core mechanic. It's built with Next.js 14 (App Router), React 18, TypeScript (strict) and Tailwind CSS 3, and chord playback is synthesized live with the Web Audio API. The app is titled Spirit Chord, and its rules come from the owner's **Chord Casters** rulebook.

**`docs/rules.md` is the source of truth for game rules.** It adapts the owner's prototype rulebook with their decisions for this app. When a rule changes, update `docs/rules.md` alongside the code. This is a solo project, and the owner decides the rules. When a rule is ambiguous, or `docs/rules.md` and the code disagree, ask instead of guessing.

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (runs type-check; fails on TS errors)
npx tsc --noEmit     # type-check only
```

- There are no tests, by the owner's choice for now. Don't add a test framework unless asked.
- `npm run lint` runs `next lint`, but ESLint is not installed or configured, so it will prompt interactively to set it up. Use `npx tsc --noEmit` for verification instead.
- **Don't run `npm run build` while a dev server is running.** Both use `.next/`, and the build breaks the running dev server (500s like `Cannot find module './819.js'`). The owner often has `npm run dev` running from VS Code, so check port 3000 first. If both have run, fix it by stopping the dev server, deleting `.next/`, and restarting.
- `.claude/launch.json` defines a `dev` config for the desktop app's browser preview. `/game` starts a match directly, using the saved loadout or the starter deck.
- Path alias: `@/*` → `src/*`.

## Architecture

### Client-only, no backend
Every page is a client component. There are no API routes or server data. All persistence is `localStorage` via `src/lib/storage.ts`, using the keys `spirit-chord:collection:v2` and `spirit-chord:loadout:v2`. The `v2` suffix was added when the card set was replaced, so saves from before that are ignored. Bump the suffix again if a change makes saved card IDs invalid.

Page flow:
- `/` calls `ensureCollection()` to seed storage.
- `/loadout`: pick a Musician, an Instrument and a 40–60 card deck with at most 1 song spirit, then `saveLoadout`.
- `/game` reads the loadout (falling back to the starter deck if it's under `DECK_MIN`) and renders `GameBoard`. A win awards 2 random cards via `addCardsToCollection`.
- `/collection` is read-only.

### Modules
- `src/types/index.ts`: all types. `AnyCard` is the card union (`chord-spirit` | `song-spirit` | `chord-spell`). Also defines `GameState`, `PlayerState`, `FieldSpirit` and the `GameAction` union.
- `src/lib/rules.ts`: **pure rule queries and constants** (`LANE_COUNT`, `NOTES_PER_TURN`, `DECK_MIN`…). Includes costs and payment (`canPayNotes`/`payNotes`), `currentPower`, `harmonyOf`, `canAttack`, `canMove`, `castLanes`, `spellPaymentOptions`, `spellTargets` and `canPlayCard`. The reducer, AI and UI all use these, so put new legality logic here, not in components.
- `src/lib/gameEngine.ts`: `gameReducer` and `createInitialState`. `gameReducer` runs the action, then `resolveDeaths`, which repeatedly removes spirits at 0 Power and then checks for a player at 0 life. **An illegal action returns the same state object**, so `gameReducer(s, a) !== s` means the action is legal.
- `src/lib/aiOpponent.ts`: `getAIAction(state)` returns **one action**, based on the current state. Its priority order is: add notes → Sun Dragon → chord spirits → spells → move → attack → `END_TURN`. Every candidate is checked with the reducer, so it only returns legal actions.
- `src/components/game/GameBoard.tsx` owns the `useReducer`.
  - **AI loop:** an effect on `state` dispatches one AI action every 650 ms. A watchdog ends the AI's turn if an action ever changes nothing, and a per-turn step cap does the same.
  - **Selection** lives in `GameState`: `selectedHandIndex` and `selectedSpiritId`.
  - **Local React state** holds the note-picker modal and the chosen spell payment.
  - **Interaction:** clicking a hand card highlights legal lanes or targets. Clicking your own spirit highlights the attack across from it and "Move here" lanes.
  - It also hard-codes the AI's loadout (`MUSICIANS[1]`, `INSTRUMENTS[0]`, `getAIDeck()`).

### Game model (see docs/rules.md for the rules themselves)
- **Turn flow:** the game starts in the `mulligan` phase. Each side keeps or mulligans once, then a coin flip (`firstPlayer`) decides who starts, and the first player skips their first draw. There are no formal phases inside a turn; limits are enforced instead (3 notes, 1 move, attacks tap). At the end of every turn, both sides' `damage` and `tempPower` reset.
- **Notes are resources, never cards or spirits.**
  - Each player has `reserve` → `pool` (untapped) → `tappedPool`, all `NoteCounts` keyed by `NoteId` (`'Cs'`).
  - The reserve holds 4 copies of each note in the instrument's `allowedNotes`.
  - Card costs use note names (`'C#'`, `'Db'`). Convert with `noteIdOf()` from `musicTheory.ts`; matching is by pitch class.
  - `NOTES`/`NOTE_MAP` in `musicTheory.ts` hold all 12 chromatic notes, for audio and for instruments like Chromatic Cannon.
- **Board:** `PlayerState.lanes` has 4 slots (`FieldSpirit | null`). Lane i faces the opponent's lane i. Attacks only go straight across; an empty lane hits the player.
- **Power is computed, never stored.** `currentPower` = printed power + song-spirit auras + attachments + `tempPower` − `damage`. Always read it through `currentPower(owner, spirit)`.
- **Harmony** = `spirit.harmony` (printed tokens) + `attachments.length`. Attachments are spell cards that stay attached. Harmony only cancels the attack from the spirit directly across from it. It isn't a taunt.
- **Song spirits** (Sun Dragon) are cast by consuming the untapped chord spirits listed in `requiredChordIds` from your board, once per game (`songSpiritCast`).

### Cards and abilities
Card definitions live in `src/data/cards.ts` (`CHORD_SPIRIT_CARDS`, `SONG_SPIRIT_CARDS`, `CHORD_SPELL_CARDS`, `MUSICIANS`, `INSTRUMENTS`, `STARTER_DECK_IDS`). Card behaviour is **data-driven**:
- **Spells:** the `SpellEffect` kinds are `damage`, `power`, `attach`, `remove-harmony` and `counter`.
- **Keywords:** `Tempo` and `Spellproof`.
- **Song spirits:** `requiredChordIds` and `auraPower`.

There are no card-ID special cases in the engine. A new card using existing effect kinds only needs data. A new effect kind needs:
- the type in `SpellEffect`,
- `applySpell` in `gameEngine.ts`,
- `spellTargets` in `rules.ts` (if targeting differs),
- `chooseSpellTarget` in `aiOpponent.ts`.

`abilityText` is display text and must be kept in sync with the actual behaviour by hand.

Musicians and Instruments are kept from the earlier design: Musician HP is starting life, and an Instrument's `allowedNotes` is its note reserve. Their **abilities are display-only** (not implemented), and some of their texts still use outdated terms (strength, will, Note Spirit).

Not implemented yet (tracked in docs/rules.md §16):
- instant-speed spells on the opponent's turn, plus Fermata (counter), which is kept out of the starter deck and is uncastable,
- Musician and Instrument abilities,
- Double Time,
- Sun Dragon's combo bonus.

### Planned: local two-player mode
The main menu's `/loadout?mode=local` link is the placeholder entry point; nothing reads `mode` yet. The engine is symmetric: actions take `who: Side`. What needs changing is in `GameBoard`: the AI effect runs whenever `currentPlayer === 'ai'`, the AI's loadout is hard-coded, and interactions are wired to `state.player` only.

### UI and styling
- **Card components:**
  - `ChordCard.tsx` exports `HandCard`, `FieldSpiritCard`, `EmptyLane`, `NoteCost` and the `LaneHighlight` type. The README's file list is outdated.
  - `NoteCard.tsx` is a pool note chip, showing untapped and tapped counts.
  - `SelectNoteCard.tsx` is the "Add Notes" button.
- Card art is placeholder CSS gradients (`artGradient`); only `src/assets/img/heroes/sunslinger.jpg` exists.
- **Theme:** custom Tailwind colors `gold-{300..600}` and `spirit-{dark,navy,purple,card,border}`, and fonts `font-cinzel`/`font-crimson` (loaded via a Google Fonts `@import` in `globals.css`). Components mix Tailwind classes with heavy inline `style` for gradients and glows. The board is laid out to fit 1920×1080.
- `audioEngine.ts` lazily creates one `AudioContext`. Interaction handlers call `resumeAudioContext()` first to satisfy browser autoplay policy. `GameBoard`'s `act()` does this and plays the action's sound (`playActionSound`), so route new player actions through it.
