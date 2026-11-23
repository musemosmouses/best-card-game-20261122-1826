// EMBER DUEL — game state and rules: turns, mana, card resolution, suit
// chains, block, healing, win/loss. Pure logic: no canvas, no sound, no clock.
// Both duelists start at 30 life; the first to 0 loses.
import { HAND_SIZE, MAX_HAND, MAX_MANA, START_HP, SUITS, cardDef } from './config.js';
import { discardCard, drawCards, newDeck } from './deck.js';
import { mulberry32 } from './random.js';

export function newSide(seedOffset) {
  return {
    hp: START_HP,
    block: 0,
    mana: 0,
    hand: [],
    deck: null,
    playedSuits: [],
    damageDealt: 0,
    cardsPlayed: 0,
    chains: 0,
    seedOffset,
  };
}

export function newGame(seed) {
  const rng = mulberry32(seed);
  const game = {
    seed,
    rng,
    turn: 0,
    phase: 'title',
    active: 'player',
    player: newSide(11),
    foe: newSide(77),
    log: ['Ash, the Cinder Warden, steps up to the table.'],
    floats: [],
    lastPlay: null,
    winner: null,
  };
  game.player.deck = newDeck(rng);
  game.foe.deck = newDeck(rng);
  drawCards(game.player.deck, game.player.hand, HAND_SIZE, rng);
  drawCards(game.foe.deck, game.foe.hand, HAND_SIZE, rng);
  return game;
}

export function startGame(game) {
  game.phase = 'play';
  game.turn = 1;
  game.active = 'player';
  beginTurn(game, game.player);
  pushLog(game, 'Turn 1 — your move. Play cards, then End Turn.');
}

export function sideOf(game, who) {
  return who === 'player' ? game.player : game.foe;
}

export function otherOf(game, who) {
  return who === 'player' ? game.foe : game.player;
}

export function pushLog(game, line) {
  game.log.push(line);
  if (game.log.length > 5) game.log.shift();
}

export function pushFloat(game, who, text, kind) {
  game.floats.push({ who, text, kind, age: 0 });
  if (game.floats.length > 8) game.floats.shift();
}

/** Start of a side's turn: mana grows with the turn number, block fades, draw to 5. */
export function beginTurn(game, side) {
  const grant = Math.min(game.turn, MAX_MANA);
  side.mana = Math.min(MAX_MANA, side.mana + grant);
  side.block = 0;
  side.playedSuits = [];
  drawCards(side.deck, side.hand, HAND_SIZE - side.hand.length, game.rng);
}

function applyChainBonus(game, who, card) {
  const side = sideOf(game, who);
  const target = otherOf(game, who);
  const suit = SUITS[card.suit];
  if (card.suit === 'ember') {
    dealDamage(game, who, target, 2);
    pushLog(game, `${nameOf(who)} chains ${suit.name}: +2 damage!`);
  } else if (card.suit === 'tide') {
    drawCards(side.deck, side.hand, 1, game.rng);
    pushLog(game, `${nameOf(who)} chains ${suit.name}: draws 1 card!`);
  } else if (card.suit === 'thorn') {
    side.hp = Math.min(START_HP, side.hp + 3);
    pushFloat(game, who, '+3', 'heal');
    pushLog(game, `${nameOf(who)} chains ${suit.name}: heals 3!`);
  } else {
    side.block += 4;
    pushFloat(game, who, '+4 block', 'block');
    pushLog(game, `${nameOf(who)} chains ${suit.name}: +4 block!`);
  }
  side.chains += 1;
}

export function nameOf(who) {
  return who === 'player' ? 'You' : 'Ash';
}

export function dealDamage(game, fromWho, targetSide, amount) {
  const absorbed = Math.min(targetSide.block, amount);
  targetSide.block -= absorbed;
  const through = amount - absorbed;
  targetSide.hp = Math.max(0, targetSide.hp - through);
  const from = sideOf(game, fromWho);
  from.damageDealt += through;
  if (through > 0) {
    pushFloat(game, fromWho === 'player' ? 'foe' : 'player', `-${through}`, 'damage');
  }
  return through;
}

/** Resolve one card. Returns false with a reason when it cannot be played. */
export function playCard(game, who, handIndex) {
  if (game.phase !== 'play') return { ok: false, reason: 'game-over' };
  if (game.active !== who) return { ok: false, reason: 'not-your-turn' };
  const side = sideOf(game, who);
  const target = otherOf(game, who);
  const id = side.hand[handIndex];
  if (id === undefined) return { ok: false, reason: 'no-card' };
  const card = cardDef(id);
  if (side.mana < card.cost) return { ok: false, reason: 'not-enough-mana' };
  side.mana -= card.cost;
  side.hand.splice(handIndex, 1);
  discardCard(side.deck, id);
  side.cardsPlayed += 1;
  game.lastPlay = { who, card, turn: game.turn };
  const suit = SUITS[card.suit];
  if (card.kind === 'strike') {
    dealDamage(game, who, target, card.value);
    pushLog(game, `${nameOf(who)} plays ${card.name} (${suit.name}): ${card.value} damage.`);
  } else if (card.kind === 'guard') {
    side.block += card.value;
    pushFloat(game, who, `+${card.value} block`, 'block');
    pushLog(game, `${nameOf(who)} plays ${card.name} (${suit.name}): +${card.value} block.`);
  } else if (card.kind === 'mend') {
    side.hp = Math.min(START_HP, side.hp + card.value);
    pushFloat(game, who, `+${card.value}`, 'heal');
    pushLog(game, `${nameOf(who)} plays ${card.name} (${suit.name}): heals ${card.value}.`);
  } else {
    drawCards(side.deck, side.hand, card.value, game.rng);
    pushLog(game, `${nameOf(who)} plays ${card.name} (${suit.name}): draws ${card.value}.`);
  }
  if (side.playedSuits.includes(card.suit)) applyChainBonus(game, who, card);
  else side.playedSuits.push(card.suit);
  checkEnd(game);
  return { ok: true, card };
}

export function checkEnd(game) {
  if (game.phase !== 'play') return;
  if (game.foe.hp <= 0) {
    game.phase = 'win';
    game.winner = 'player';
    pushLog(game, 'Ash falls — YOU WIN the duel!');
  } else if (game.player.hp <= 0) {
    game.phase = 'loss';
    game.winner = 'foe';
    pushLog(game, 'Your ember gutters out — Ash wins the duel.');
  }
}

/** End the active side's turn; the other side begins (the foe plays at once). */
export function endTurn(game, playFoe) {
  if (game.phase !== 'play') return;
  if (game.active === 'player') {
    game.active = 'foe';
    beginTurn(game, game.foe);
    pushLog(game, `Turn ${game.turn} — Ash thinks...`);
    if (playFoe) playFoe(game);
    if (game.phase !== 'play') return;
    game.turn += 1;
    game.active = 'player';
    beginTurn(game, game.player);
    pushLog(game, `Turn ${game.turn} — your move.`);
  }
}

export function scoreOf(side) {
  return side.damageDealt + side.cardsPlayed * 2 + side.chains * 5;
}

export function playableIndexes(game, who) {
  const side = sideOf(game, who);
  const out = [];
  side.hand.forEach((id, i) => {
    if (cardDef(id).cost <= side.mana) out.push(i);
  });
  return out;
}

export function canAfford(game, who, handIndex) {
  const side = sideOf(game, who);
  const id = side.hand[handIndex];
  return id !== undefined && cardDef(id).cost <= side.mana;
}

