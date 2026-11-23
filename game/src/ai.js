// EMBER DUEL — Ash, the Cinder Warden: a real opponent strategy, not random.
// Every turn Ash scores each playable card and plays the best one, then
// re-scores: lethal first, guard when hurt, finishers saved for the kill,
// suit chains chased when they pay, Mend held until it matters.
import { START_HP, cardDef } from './config.js';
import { canAfford, endTurn, nameOf, playCard, sideOf } from './state.js';
import { seededPick } from './random.js';

/** Value of playing `card` now, from Ash's side of the table. */
export function scoreCard(game, card, hand) {
  const ash = game.foe;
  const you = game.player;
  let score = 0;
  if (card.kind === 'strike') {
    score += card.value * 2;
    // Lethal: damage through block that ends the game outranks everything.
    if (card.value - you.block >= you.hp) score += 100;
    // Big Ember finishers are worth holding a turn for — unless they kill now.
    if (card.cost >= 5 && card.value - you.block < you.hp) score -= 6;
  } else if (card.kind === 'guard') {
    // Guard is worth little at full life, everything when one hit from dead.
    score += ash.hp <= 10 ? card.value * 3 : card.value * 0.6;
    if (you.hp <= 6) score -= 4;
  } else if (card.kind === 'mend') {
    const missing = START_HP - ash.hp;
    score += missing <= 0 ? -8 : Math.min(card.value, missing) * 2;
    if (missing < 4) score -= 6;
  } else {
    // Draw: good early when the hand is thin, bad with a full hand — but a
    // hand with no damage in it must cycle, or the duel stalls forever.
    score += hand.length <= 3 ? 9 : 2;
    if (!hand.some((id) => cardDef(id).kind === 'strike')) score += 8;
  }
  // Suit chains pay: a second card of a suit already played this turn gains.
  if (ash.playedSuits.includes(card.suit)) score += 7;
  // Efficiency: cheap damage per mana beats slow damage.
  score += (card.value / Math.max(1, card.cost)) * 0.5;
  return score;
}

/** Ash's whole turn: keep playing the best affordable card until none is worth it. */
export function playFoeTurn(game) {
  const ash = game.foe;
  let guard = 0;
  while (game.phase === 'play' && guard < 12) {
    guard += 1;
    let best = -1;
    let bestScore = 0;
    let fallback = -1;
    let fallbackScore = -Infinity;
    ash.hand.forEach((id, i) => {
      if (!canAfford(game, 'foe', i)) return;
      const s = scoreCard(game, cardDef(id), ash.hand);
      if (s > fallbackScore) {
        fallbackScore = s;
        fallback = i;
      }
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    });
    // Nothing scores above zero: still play the best affordable card rather
    // than pass forever — cycling the hand is how a duel moves.
    if (best === -1) best = fallback;
    if (best === -1) break;
    playCard(game, 'foe', best);
  }
  return game;
}

/** One full round from the player's End Turn click: foe plays, turn passes. */
export function runFoeTurn(game) {
  endTurn(game, (g) => playFoeTurn(g));
}

/** Pick Ash's opening taunt line for the title screen (seeded, stable). */
export function foeTaunt(game) {
  const lines = [
    '“Your ember is small. Mine has burned a hundred duels.”',
    '“I have read every card in your deck. Play anyway.”',
    '“The table remembers every loser. Sit down.”',
  ];
  return seededPick(lines, game.rng);
}

