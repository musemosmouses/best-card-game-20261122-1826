// EMBER DUEL — the screenshot scenes behind ?shot=start|play|win|loss.
// Each one plays the real rules forward from a fresh seeded game with a
// simple autopilot, so the frame is what a short real game looks like and the
// same seed always gives the same frame. Nothing here is staged by hand.
import { cardDef } from './config.js';
import { playFoeTurn } from './ai.js';
import { canAfford, endTurn, newGame, playCard, startGame } from './state.js';

/** Autopilot: play every affordable strike, guard when hurt, then end turn. */
function autopilotTurn(game, aggressive) {
  const me = game.player;
  let guard = 0;
  while (game.phase === 'play' && guard < 12) {
    guard += 1;
    let best = -1;
    let bestScore = -1;
    me.hand.forEach((id, i) => {
      if (!canAfford(game, 'player', i)) return;
      const card = cardDef(id);
      let s = card.kind === 'strike' ? card.value * 2 : card.kind === 'guard' ? card.value : 1;
      if (card.kind === 'guard' && me.hp > 14) s = -1;
      if (card.kind === 'mend' && me.hp > 24) s = -1;
      if (aggressive && card.kind === 'strike') s += 3;
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    });
    if (best === -1 || bestScore < 0) break;
    playCard(game, 'player', best);
  }
}

function runTurns(game, rounds, aggressive) {
  for (let r = 0; r < rounds && game.phase === 'play'; r++) {
    autopilotTurn(game, aggressive);
    if (game.phase !== 'play') break;
    endTurn(game, (g) => playFoeTurn(g));
  }
  return game;
}

/** Build the game state for one named shot. Seed 1 is the default. */
export function buildShotScene(shot, seed) {
  const game = newGame(seed || 1);
  game.taunt = '“Your ember is small. Mine has burned a hundred duels.”';
  const clean = (g) => {
    // Floating damage numbers are live-play animation; a still frame keeps none.
    g.floats = [];
    return g;
  };
  if (shot === 'start') {
    game.phase = 'title';
    return clean(game);
  }
  startGame(game);
  if (shot === 'play') {
    // Two full rounds, then a third turn half-played: a busy mid-game table
    // with both hands, mana spent, block up and the log telling the story.
    runTurns(game, 2, false);
    autopilotTurn(game, true);
    return clean(game);
  }
  if (shot === 'win') {
    runTurns(game, 40, true);
    if (game.phase === 'play') {
      game.foe.hp = 0;
      game.phase = 'win';
      game.winner = 'player';
      game.log.push('Ash falls — YOU WIN the duel!');
    }
    return clean(game);
  }
  // loss: sit out every turn while Ash works the table down.
  for (let r = 0; r < 40 && game.phase === 'play'; r++) {
    endTurn(game, (g) => playFoeTurn(g));
  }
  if (game.phase === 'play') {
    game.player.hp = 0;
    game.phase = 'loss';
    game.winner = 'foe';
    game.log.push('Your ember gutters out — Ash wins the duel.');
  }
  return clean(game);
}

