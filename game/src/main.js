// EMBER DUEL — boot, input and the animation loop.
// Mouse: click a hand card to play it, click End Turn, click to begin / play
// again. Keyboard: 1–7 play a hand card, Space/Enter ends the turn (or begins),
// R restarts from an end screen, M mutes. ?shot=start|play|win|loss renders
// one deterministic scene for screenshots and then stops.
import { TABLE_H, TABLE_W, cardDef } from './config.js';
import { buildShotScene } from './shots.js';
import { runFoeTurn } from './ai.js';
import { canAfford, endTurn, newGame, playCard, startGame } from './state.js';
import { againRect, beginRect, endTurnRect, playerHandRects, renderGame } from './render.js';
import { sfxBlock, sfxChain, sfxClick, sfxDraw, sfxHeal, sfxHit, sfxLose, sfxPlay, sfxWin, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let game = newGame(seed);
let restarts = 0;
let hover = -1;
let lastPhase = game.phase;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / TABLE_W, window.innerHeight / TABLE_H);
  canvas.style.width = `${Math.floor(TABLE_W * scale)}px`;
  canvas.style.height = `${Math.floor(TABLE_H * scale)}px`;
}

function announce() {
  const me = game.player;
  const foe = game.foe;
  statusEl.textContent =
    game.phase === 'title'
      ? 'Ember Duel title screen. Press Enter to sit down and duel.'
      : game.phase === 'play'
        ? `Turn ${game.turn}. You have ${me.hp} life, ${me.mana} mana. Ash has ${foe.hp} life.`
        : game.phase === 'win'
          ? 'You win the duel.'
          : 'Ash wins the duel.';
}

function playSoundFor(result) {
  if (!result.ok) return;
  const card = result.card;
  if (card.kind === 'strike') sfxHit();
  else if (card.kind === 'guard') sfxBlock();
  else if (card.kind === 'mend') sfxHeal();
  else sfxDraw();
  const side = game.player;
  if (side.chains > 0 && side.playedSuits.length > 0) sfxChain();
}

function tryPlay(index) {
  if (game.phase !== 'play' || game.active !== 'player') return;
  const result = playCard(game, 'player', index);
  if (!result.ok) {
    if (result.reason === 'not-enough-mana') {
      game.log.push('Not enough mana for that card.');
    }
    return;
  }
  sfxPlay();
  playSoundFor(result);
  afterAction();
}

function tryEndTurn() {
  if (game.phase !== 'play' || game.active !== 'player') return;
  sfxClick();
  endTurn(game, (g) => runFoeTurn(g));
  afterAction();
}

function afterAction() {
  if (game.phase === 'win' && lastPhase !== 'win') sfxWin();
  if (game.phase === 'loss' && lastPhase !== 'loss') sfxLose();
  lastPhase = game.phase;
  announce();
}

function beginDuel() {
  sfxClick();
  startGame(game);
  lastPhase = game.phase;
  announce();
}

function restartDuel() {
  restarts += 1;
  game = newGame(seed + restarts);
  game.taunt = '“Again. The table is patient. I am not.”';
  lastPhase = game.phase;
  announce();
}

function pointIn(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * TABLE_W,
    y: ((event.clientY - rect.top) / rect.height) * TABLE_H,
  };
}

canvas.addEventListener('mousemove', (event) => {
  const p = canvasPoint(event);
  hover = -1;
  if (game.phase === 'play') {
    playerHandRects(game).forEach((r) => {
      if (pointIn(r, p.x, p.y)) hover = r.index;
    });
  }
});

canvas.addEventListener('click', (event) => {
  const p = canvasPoint(event);
  if (game.phase === 'title') {
    if (pointIn(beginRect(), p.x, p.y)) beginDuel();
    return;
  }
  if (game.phase === 'win' || game.phase === 'loss') {
    if (pointIn(againRect(), p.x, p.y)) restartDuel();
    return;
  }
  if (pointIn(endTurnRect(), p.x, p.y)) {
    tryEndTurn();
    return;
  }
  const rects = playerHandRects(game);
  for (const r of rects) {
    if (pointIn(r, p.x, p.y)) {
      tryPlay(r.index);
      return;
    }
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    toggleMute();
    return;
  }
  if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    beginDuel();
    return;
  }
  if ((game.phase === 'win' || game.phase === 'loss') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
    restartDuel();
    return;
  }
  if (game.phase !== 'play' || game.active !== 'player') return;
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    tryEndTurn();
    return;
  }
  const n = Number(event.key);
  if (n >= 1 && n <= 7) tryPlay(n - 1);
});

function frame(now) {
  const dt = 0.016;
  game.floats.forEach((f) => {
    f.age += dt;
  });
  game.floats = game.floats.filter((f) => f.age < 1);
  renderGame(ctx, game, { hover });
  requestAnimationFrame(frame);
}

function boot() {
  canvas.width = TABLE_W;
  canvas.height = TABLE_H;
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  if (shot) {
    game = buildShotScene(shot, seed);
    lastPhase = game.phase;
    renderGame(ctx, game, { hover: -1 });
    announce();
    document.title = `Ember Duel — ${shot}`;
    return;
  }
  game.taunt = '“Your ember is small. Mine has burned a hundred duels.”';
  announce();
  requestAnimationFrame(frame);
}

boot();

