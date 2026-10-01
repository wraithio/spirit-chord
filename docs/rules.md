# Chord Casters — Rules (digital build)

*Adapted from the prototype rulebook (`Chord_Casters_Rules.md`) with the owner's decisions for this app applied. This file is the source of truth for game rules in the code. Items marked **[Playtest]** are still open to change. The app itself is still titled Spirit Chord.*

---

## 1. What This Game Is

A two-player strategy card game. Each player picks a **Musician** (their character) and a magic **Instrument**, and brings a deck of **chord spirits**, one **song spirit**, and **chord spells**.

You spend **notes** to cast spirits and spells, fight down four **lanes**, and try to combine the four chords of the progression into the **Sun Dragon**.

A second purpose of the game is to teach how notes form chords, and how chords form a progression.

The app currently plays against an AI opponent. Local two-player is planned.

---

## 2. Win Conditions

You win when the opposing player's life total is reduced to **0**.

There is **no** deck-out loss. A player who cannot draw simply skips the draw.

**Starting life** is your Musician's HP (see §13).

---

## 3. Components

### 3.1 Decks
- Deck size: **40–60** cards. **[Playtest: try 50]**
- Starting hand: **6** cards. **[Playtest: 4–7]**
- Draw: **1** card at the start of your turn.
- No maximum hand size.
- Mulligan: you may **mulligan once for free** (shuffle that hand away, draw a new hand of the same size). No further redraws.
- A coin flip decides who goes first. The first player **skips their first draw**.

### 3.2 Musician
Your character. Its HP is your starting life. Each Musician has an ability (abilities are shown but not yet implemented). See §13.

### 3.3 Instrument
Your instrument sets your **scale**: which notes exist in your note reserve. Each instrument also has an ability (shown but not yet implemented). See §13.

### 3.4 Note reserve
Each player has a personal reserve of **4 copies of each note in their instrument's scale**. A 7-note scale gives 28 notes. Chromatic Cannon's 12-note scale gives 48.

Notes are **resources**, not spirits. They are not shuffled into the deck.

### 3.5 Card types
| Type | Stays on the field? | Cost |
|---|---|---|
| **Chord spirit** | Yes | 3 notes (a triad) |
| **Song spirit** | Yes | Combine specific chord spirits already on your board |
| **Chord spell** | No (one-shot), unless it attaches to a spirit | Its chord's notes **or** tapping a matching chord spirit |

Note spirits and chord enchantments are not used.

---

## 4. The Board

### 4.1 Four lanes
The board has **four lanes**. Each player has one slot per lane, and each slot holds at most **one spirit**.

Lanes face each other: the spirit in your lane 1 sits across from the spirit in the opponent's lane 1.

There are no "correct" lanes and no anthems. Any spirit may be cast into any empty lane.

### 4.2 Harmony
Some spirits enter with **Harmony** tokens on them. Some attachments also **count as Harmony**.

- Harmony works **only in its own lane**. The first attack against a Harmony spirit **from the spirit directly across** is **negated**: the whole clash is cancelled, neither spirit takes damage, and one Harmony is removed.
- Each Harmony cancels one attack. A spirit with 3 Harmony cancels three attacks.
- If a spirit has both its own Harmony and a Harmony attachment, its own Harmony is removed first. When an attachment's Harmony is removed, the attachment goes to the discard and its effect ends.
- Harmony is **not** a taunt. It never stops the opponent from attacking you through an empty lane.
- Spells ignore Harmony. It only cancels attacks.
- You **cannot** put Harmony back on a spirit that already lost it.

**Stat budget:** on a 3-note chord spirit, **1 Harmony = 2 stat points** and **1 Power = 1 stat point**. Fair prints include:

- 3 Power
- 1 Power + 1 Harmony
- 2 Power + a modest ability (example: Tempo)

---

## 5. Notes and Paying Costs

### 5.1 Playing notes
On each of your turns you may move **up to 3 notes** from your reserve into your **note pool**.

- Notes in the pool are permanent. Unused notes stay.
- You choose freely among the notes still left in your reserve.

### 5.2 Tapping notes
To pay a card's note cost, **tap** matching notes in your pool.

- Tapped notes stay in the pool. They are spent until they untap.
- All your notes untap **at the start of your turn**.
- Notes match by pitch, so a C# in the pool pays for a card asking for Db.

### 5.3 What notes can pay
- **Spirits** must be paid with notes.
- **Spells** may be paid with notes **or** by tapping a **matching chord spirit** (see §8.1).

---

## 6. Turn Structure

1. **Untap:** your notes and spirits untap.
2. **Draw:** 1 card (skipped on the first player's first turn).
3. **Your turn:** in any order, add up to 3 notes, cast spirits and spells, move one spirit, and attack.
4. **End turn:** temporary effects expire and damage on surviving spirits is cleared (this happens at the end of **each** player's turn).

**Timing:** spirits can be cast only on your turn. Spells can currently be cast only on your turn too. Instant-speed spells on the opponent's turn are planned (see §16).

---

## 7. Combat

### 7.1 Power
Each spirit has a single **Power** number. Power is both its attack and its health.

- A 4 fights a 4: both go to 0 and both die.
- A 5 fights a 4: the 4 dies; the 5 is left at 1 until the turn ends, then it resets to 5.
- Whenever a spirit's Power is **0 or less** (from damage or a debuff), it goes to the **discard**.

Current Power = printed Power + auras + attachments + until-end-of-turn changes − damage.

### 7.2 Lanes and targeting
A spirit may only attack **the spirit directly across from it**.

- If that lane is **empty** on the opponent's side, the attack hits the **opposing player** for the attacker's Power.
- Both spirits deal their Power to each other at the same time, unless Harmony cancels the clash.

### 7.3 Attacking
- Attacking **taps** the spirit. A tapped spirit can't attack, and can't pay for a spell until it untaps.
- A spirit **cannot attack** the turn it is played unless it has **Tempo**.
- A spirit that tapped to pay for a spell this turn cannot attack.

### 7.4 Movement
Once per turn, on your turn, you may **move one spirit** into a different **empty** lane on your side. A spirit may move and attack in the same turn.

### 7.5 Keywords
| Keyword | Means |
|---|---|
| **Tempo** | This spirit may attack the turn it is played. |
| **Spellproof** | Cannot be targeted by spells. |
| **Double Time** | First strike or double strike. **[Playtest: not implemented until a card uses it.]** |

---

## 8. Spells and Tapping Spirits

### 8.1 Tapping a spirit as payment
Instead of notes, you may **tap an untapped chord spirit** whose chord matches the spell. For example, tap a CEG spirit to pay for a CEG spell.

- The spirit stays on the board, tapped, and cannot attack this turn.
- This is allowed on the turn the spirit was played. Summoning sickness only stops attacks.

### 8.2 Combining chords into the Sun Dragon
The **Sun Dragon** is cast by combining one of each Excalibur-progression chord spirit on your board: **Tonic Guardian (CEG), Dominant Dragon (GBD), Aeolian Fox (ACE), Subdominant Sage (FAC)**.

- All four must be **untapped**. Their lanes don't matter.
- The four chord spirits are **removed** to the discard (with anything attached to them). Their Harmony does not transfer.
- The Sun Dragon enters an empty lane of your choice.

---

## 9. Chord Spells

Each spell costs its chord's three notes, or a tapped matching chord spirit. "Target spirit" means any spirit on either side that isn't Spellproof.

### 9.1 Wave 1
| Chord | Spell | Effect |
|---|---|---|
| CEG | **Tonic Strike** | Deal 3 damage to target spirit. |
| GBD | **Crescendo** | Target spirit gets +2 Power until end of turn. |
| ACE | **Diminuendo** | Target spirit gets −2 Power until end of turn. |
| FAC | **Sustain** | Attach to target spirit. It gets +1 Power while attached. Counts as Harmony. |

### 9.2 Wave 2
| Chord | Spell | Effect |
|---|---|---|
| CEG | **Fermata** | Counter target chord spell. *(Needs instant speed; see §16.)* |
| GBD | **Dissonance** | Remove all Harmony from target spirit, including Harmony attachments. |
| ACE | **Minor Ward** | Attach to target spirit. It has Spellproof while attached. Counts as Harmony. |
| FAC | **Forte** | Deal 2 damage to any target, including players. |

*Spell names are placeholders.*

---

## 10. Damage, Buffs, and the End of Turn

- Damage to a spirit reduces its current Power for the rest of the turn.
- At the end of **each** player's turn, until-end-of-turn changes expire and damage on surviving spirits is cleared.
- Player life does **not** reset.

---

## 11. Building a Deck

Starter deck (45 cards):

- 4× each chord spirit (Tonic Guardian, Dominant Dragon, Aeolian Fox, Subdominant Sage)
- 1× Sun Dragon (unique: max one per deck, once per game)
- 4× each chord spell except Fermata, which joins once instant speed exists

---

## 12. Cards

### 12.1 Chord spirits
| Name | Chord | Power | Harmony | Keywords |
|---|---|---|---|---|
| Tonic Guardian | CEG — C major | 3 | 0 | — |
| Dominant Dragon | GBD — G major | 2 | 0 | Tempo |
| Aeolian Fox | ACE — A minor | 1 | 1 | — |
| Subdominant Sage | FAC — F major | 3 | 0 | — |

### 12.2 Sun Dragon
**Type:** Song spirit (unique, once per game).
**Cost:** combine Tonic Guardian + Dominant Dragon + Aeolian Fox + Subdominant Sage (§8.2).
**Body:** 7 Power, 3 Harmony.
**Aura:** your other spirits get +1 Power.
**Combo bonus:** **[Playtest: to be defined; not implemented.]**

---

## 13. Musicians and Instruments

Abilities are displayed but **not yet implemented**. Some ability texts still use older terms (strength, will, Note Spirit) and need rewriting.

| Musician | HP (starting life) |
|---|---|
| The Sunslinger | 20 |
| The Resonant | 18 |
| The Dissonant | 22 |

| Instrument | Scale (note reserve) |
|---|---|
| Southern Belle | C major |
| Minor Mandate | A minor |
| Chromatic Cannon | Chromatic (all 12 notes) |
| Excalibur | C major |

---

## 14. Rules That Are Deliberately Off

- Note spirits (as cards or as 1/1 spirits)
- Separate Attack and Health tracks
- Anthems and "correct" lanes
- Harmony as a global taunt
- Unlimited spirits on the field (replaced by four lanes)
- Deck-out as a loss
- Re-applying Harmony onto the same spirit

---

## 15. Quick Reference

**On your turn:** untap → draw → add up to 3 notes → cast / move / attack in any order → pass.

**Pay spirits with notes. Pay spells with notes or a tapped matching chord spirit.**

**Power is health. 0 dies. Survivors reset at end of turn.**

**Harmony cancels the first attack from the spirit across from it.**

**Empty lane in front of you = hit the player.**

**Move one spirit per turn. Attacking taps.**

**Four chords on your board, untapped, can be combined into the Sun Dragon.**

---

## 16. Open Items

1. **Instant speed** (not built yet): spells on the opponent's turn, with a response step after each cast and attack, plus Fermata (counter). Until then, spells are cast on your own turn only.
2. Starting hand 4 vs 6 vs 7.
3. Deck size 40 vs 50 vs 60.
4. Sun Dragon's combo bonus.
5. Double Time = first strike or double strike?
6. Musician and Instrument abilities under these rules.
7. First-player advantage with Tempo.
