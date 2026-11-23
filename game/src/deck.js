// EMBER DUEL — the 30-card deck: draw, discard, reshuffle.
// Both duelists draw from the same 30-card list (12 designs, fixed copies),
// shuffled once per game from the seeded rng.
import { CARDS, DECK_COPIES } from './config.js';
import { seededShuffle } from './random.js';

export function buildDeckIds() {
  const ids = [];
  CARDS.forEach((card, index) => {
    for (let n = 0; n < DECK_COPIES[index]; n++) ids.push(card.id);
  });
  return ids;
}

export function newDeck(rng) {
  return { draw: seededShuffle(buildDeckIds(), rng), discard: [] };
}

/** Draw `count` cards into `hand` (max 7); reshuffle the discard when empty. */
export function drawCards(deck, hand, count, rng) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (deck.draw.length === 0) {
      if (deck.discard.length === 0) break;
      deck.draw = seededShuffle(deck.discard, rng);
      deck.discard = [];
    }
    if (hand.length >= 7) {
      deck.discard.push(deck.draw.pop());
      continue;
    }
    const id = deck.draw.pop();
    hand.push(id);
    drawn.push(id);
  }
  return drawn;
}

/** Move a played card id to the discard pile. */
export function discardCard(deck, id) {
  deck.discard.push(id);
}

export function deckCount(deck) {
  return deck.draw.length;
}

