// EMBER DUEL — constants, suits and the 12-card set.
// Four original suits, told apart by colour AND shape AND name, so a card is
// readable even at thumbnail size. A card's cost is its mana price; its value
// is damage, block or healing, depending on its kind.
export const TABLE_W = 1280;
export const TABLE_H = 720;
export const START_HP = 30;
export const HAND_SIZE = 5;
export const MAX_HAND = 7;
export const MAX_MANA = 10;
export const DECK_COPIES = [3, 3, 2, 2, 3, 2, 2, 2, 3, 2, 3, 3];

export const SUITS = {
  ember: { name: 'Ember', color: '#e8491d', dark: '#8f1f05', glyph: '▲', bonus: 'Ember chain: +2 damage' },
  tide: { name: 'Tide', color: '#1d7fe8', dark: '#0a3d75', glyph: '≈', bonus: 'Tide chain: draw 1 card' },
  thorn: { name: 'Thorn', color: '#2fae4e', dark: '#145c26', glyph: '✦', bonus: 'Thorn chain: heal 3' },
  stone: { name: 'Stone', color: '#8a8f98', dark: '#4a4e55', glyph: '◆', bonus: 'Stone chain: +4 block' },
};

// kind: strike deals damage, guard adds block, mend heals, trick draws cards.
// value is the base number; cost is mana. Chain bonus fires when two cards of
// the same suit are played in one turn (see state.js).
export const CARDS = [
  { id: 'cinder', name: 'Cinder Flick', suit: 'ember', kind: 'strike', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'flare', name: 'Flare Burst', suit: 'ember', kind: 'strike', cost: 3, value: 8, text: 'Deal 8 damage.' },
  { id: 'pyre', name: 'Pyre Column', suit: 'ember', kind: 'strike', cost: 5, value: 13, text: 'Deal 13 damage.' },
  { id: 'undertow', name: 'Undertow', suit: 'tide', kind: 'strike', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { id: 'surge', name: 'Surge Call', suit: 'tide', kind: 'trick', cost: 2, value: 2, text: 'Draw 2 cards.' },
  { id: 'deep', name: 'Deep Current', suit: 'tide', kind: 'guard', cost: 2, value: 7, text: 'Gain 7 block.' },
  { id: 'briar', name: 'Briar Lash', suit: 'thorn', kind: 'strike', cost: 2, value: 4, text: 'Deal 4 damage.' },
  { id: 'sap', name: 'Sap Bloom', suit: 'thorn', kind: 'mend', cost: 2, value: 6, text: 'Heal 6 life.' },
  { id: 'root', name: 'Root Wall', suit: 'thorn', kind: 'guard', cost: 1, value: 5, text: 'Gain 5 block.' },
  { id: 'pebble', name: 'Pebble Shot', suit: 'stone', kind: 'strike', cost: 0, value: 2, text: 'Deal 2 damage.' },
  { id: 'bulwark', name: 'Bulwark', suit: 'stone', kind: 'guard', cost: 3, value: 11, text: 'Gain 11 block.' },
  { id: 'avalanche', name: 'Avalanche', suit: 'stone', kind: 'strike', cost: 4, value: 10, text: 'Deal 10 damage.' },
];

export function cardDef(id) {
  return CARDS.find((c) => c.id === id);
}

export function suitOf(card) {
  return SUITS[card.suit];
}

