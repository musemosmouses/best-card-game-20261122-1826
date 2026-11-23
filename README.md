# Ember Duel — 30 cards, 12 designs, 4 suits, suit-chain combos, smart AI rival, win + loss screens

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/musemosmouses/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/musemosmouses/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A complete original turn-based card duel: you vs Ash, the Cinder Warden.
30 life each, mana that grows every turn, a 30-card deck of 12 designs across
4 suits — Ember, Tide, Thorn, Stone — told apart by colour, glyph and name.
Play two cards of one suit in a turn to trigger a chain bonus (Ember +2
damage, Tide draw 1, Thorn heal 3, Stone +4 block). Ash plays a real strategy:
lethal first, guards when hurt, saves Ember finishers, chases chains.

- **Play a card:** click it, or press 1–7 · **End turn:** click End Turn or Space
- **Win:** reduce Ash to 0 life · **Lose:** your life hits 0 · **Mute:** M · **Rematch:** R
- **Score:** damage dealt + cards played + suit chains, shown live beside both life totals

Pure static files — open `game/index.html` in a desktop browser, no network,
no build step. Sound is synthesized WebAudio only. Screenshots are real
renders of the game (`?shot=start|play|win|loss`, fixed seed).

Run the hand-in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`
