// EMBER DUEL — canvas rendering: the felt table, both hands, cards, HP and
// mana bars, log, title/win/loss screens. Everything is drawn, no images:
// suits are told apart by colour AND glyph AND name at every size.
import { MAX_MANA, START_HP, SUITS, TABLE_H, TABLE_W, cardDef } from './config.js';
import { scoreOf } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'loss';

export const CARD_W = 142;
export const CARD_H = 198;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 600} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One face-up card. `lift` raises it (hover), `dim` greys it (unaffordable). */
export function drawCard(ctx, card, x, y, w, h, lift, dim) {
  const suit = SUITS[card.suit];
  const yy = y - (lift || 0);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = lift ? 18 : 8;
  ctx.shadowOffsetY = lift ? 8 : 4;
  roundRect(ctx, x, yy, w, h, 12);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, yy, w, h, 12);
  ctx.strokeStyle = dim ? '#9a9a9a' : suit.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Suit band with name — colour + glyph + word, never colour alone.
  ctx.fillStyle = suit.color;
  roundRect(ctx, x + 6, yy + 6, w - 12, 30, 8);
  ctx.fill();
  text(ctx, `${suit.glyph} ${suit.name.toUpperCase()}`, x + w / 2, yy + 22, 15, '#ffffff', 'center', 800);
  // Cost orb, top-left over the band edge.
  ctx.beginPath();
  ctx.arc(x + 20, yy + 52, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#1d3557';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  text(ctx, String(card.cost), x + 20, yy + 53, 20, '#ffd166', 'center', 800);
  text(ctx, 'MANA', x + 20, yy + 76, 8, '#5a5a5a', 'center', 700);
  // Big value in the middle, labelled by kind.
  const kindWord = card.kind === 'strike' ? 'DAMAGE' : card.kind === 'guard' ? 'BLOCK' : card.kind === 'mend' ? 'HEAL' : 'DRAW';
  text(ctx, String(card.value), x + w / 2, yy + 108, 44, dim ? '#8a8a8a' : '#222222', 'center', 800);
  text(ctx, kindWord, x + w / 2, yy + 140, 11, '#666666', 'center', 800);
  // Glyph watermark behind the value.
  ctx.globalAlpha = 0.14;
  text(ctx, suit.glyph, x + w / 2, yy + 108, 72, suit.color, 'center', 800);
  ctx.globalAlpha = 1;
  // Name and rules text.
  text(ctx, card.name, x + w / 2, yy + 162, 14, '#222222', 'center', 700);
  text(ctx, card.text, x + w / 2, yy + 182, 11, '#555555', 'center', 400);
  if (dim) {
    ctx.fillStyle = 'rgba(120,120,120,0.28)';
    roundRect(ctx, x, yy, w, h, 12);
    ctx.fill();
  }
}

/** Face-down card back: ember sigil on deep red, with a count when stacked. */
export function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = '#7a1f0d';
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, 9);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 6);
  ctx.strokeStyle = 'rgba(255,209,102,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, '▲', x + w / 2, y + h / 2, Math.min(34, w * 0.45), '#ffd166', 'center', 800);
}

function hpBar(ctx, x, y, w, label, hp, block) {
  text(ctx, label, x, y - 14, 13, '#e8e0c8', 'left', 800);
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fillStyle = '#2b0d08';
  ctx.fill();
  const frac = Math.max(0, hp / START_HP);
  if (frac > 0) {
    roundRect(ctx, x, y, Math.max(22, w * frac), 22, 11);
    ctx.fillStyle = hp <= 8 ? '#e8491d' : '#3fae5a';
    ctx.fill();
  }
  text(ctx, `${hp} / ${START_HP} HP`, x + w / 2, y + 11, 13, '#ffffff', 'center', 800);
  if (block > 0) {
    text(ctx, `🛡 ${block} block`, x + w + 12, y + 11, 13, '#9ecfff', 'left', 700);
  }
}

function manaPips(ctx, x, y, mana) {
  text(ctx, 'MANA', x, y, 12, '#ffd166', 'left', 800);
  for (let i = 0; i < MAX_MANA; i++) {
    ctx.beginPath();
    ctx.arc(x + 52 + i * 20, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#4aa3ff' : '#22384f';
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  text(ctx, `${mana}/${MAX_MANA}`, x + 52 + MAX_MANA * 20 + 8, y, 13, '#e8e0c8', 'left', 700);
}

function drawTable(ctx) {
  const grad = ctx.createRadialGradient(640, 330, 80, 640, 360, 760);
  grad.addColorStop(0, '#2e6b46');
  grad.addColorStop(0.7, '#1d4d30');
  grad.addColorStop(1, '#0e2a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TABLE_W, TABLE_H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 5;
  roundRect(ctx, 14, 14, TABLE_W - 28, TABLE_H - 28, 26);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,162,39,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 360, 430, 210, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.16;
  text(ctx, 'EMBER DUEL', 640, 360, 92, '#ffffff', 'center', 800);
  ctx.globalAlpha = 1;
}

export function playerHandRects(game) {
  const n = game.player.hand.length;
  const step = n <= 1 ? 0 : Math.min(150, (TABLE_W - 240) / (n - 1));
  const total = (n - 1) * step + CARD_W;
  const startX = (TABLE_W - total) / 2;
  return game.player.hand.map((id, i) => ({
    x: startX + i * step,
    y: 470,
    w: CARD_W,
    h: CARD_H,
    index: i,
    id,
  }));
}

export function endTurnRect() {
  return { x: 1010, y: 236, w: 230, h: 58 };
}

export function beginRect() {
  return { x: 440, y: 520, w: 400, h: 64 };
}

export function againRect() {
  return { x: 440, y: 540, w: 400, h: 64 };
}

/** Compact last-played card: same face, squeezed into a 100x140 frame. */
export function drawMiniCard(ctx, card, x, y) {
  const suit = SUITS[card.suit];
  const w = 100;
  const h = 140;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, 9);
  ctx.strokeStyle = suit.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = suit.color;
  roundRect(ctx, x + 5, y + 5, w - 10, 22, 6);
  ctx.fill();
  text(ctx, `${suit.glyph} ${suit.name.toUpperCase()}`, x + w / 2, y + 17, 11, '#ffffff', 'center', 800);
  ctx.beginPath();
  ctx.arc(x + 18, y + 44, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#1d3557';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, String(card.cost), x + 18, y + 45, 15, '#ffd166', 'center', 800);
  const kindWord = card.kind === 'strike' ? 'DAMAGE' : card.kind === 'guard' ? 'BLOCK' : card.kind === 'mend' ? 'HEAL' : 'DRAW';
  text(ctx, String(card.value), x + w / 2, y + 86, 30, '#222222', 'center', 800);
  text(ctx, kindWord, x + w / 2, y + 108, 9, '#666666', 'center', 800);
  text(ctx, card.name, x + w / 2, y + 126, 11, '#222222', 'center', 700);
}

function drawFoeRow(ctx, game) {
  const foe = game.foe;
  ctx.beginPath();
  ctx.arc(96, 128, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#7a1f0d';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '▲', 96, 130, 40, '#ffd166', 'center', 800);
  text(ctx, 'ASH', 96, 188, 14, '#ffd166', 'center', 800);
  text(ctx, 'Cinder Warden', 96, 206, 11, '#cbbf9a', 'center', 400);
  hpBar(ctx, 160, 96, 330, 'ASH — OPPONENT', foe.hp, foe.block);
  manaPips(ctx, 160, 140, foe.mana);
  text(ctx, `SCORE ${scoreOf(foe)}`, 160, 168, 13, '#e8e0c8', 'left', 700);
  foe.hand.forEach((id, i) => {
    drawCardBack(ctx, 560 + i * 30, 66, 64, 92);
  });
  text(ctx, `Ash's hand: ${foe.hand.length} cards`, 560, 178, 12, '#cbbf9a', 'left', 600);
  text(ctx, `Deck: ${foe.deck.draw.length}`, 760, 178, 12, '#cbbf9a', 'left', 600);
  if (game.lastPlay && game.lastPlay.who === 'foe') {
    text(ctx, 'ASH LAST PLAYED', 1130, 52, 11, '#cbbf9a', 'center', 700);
    drawMiniCard(ctx, game.lastPlay.card, 1080, 62);
  } else if (game.lastPlay && game.lastPlay.who === 'player') {
    text(ctx, 'YOU LAST PLAYED', 1130, 52, 11, '#cbbf9a', 'center', 700);
    drawMiniCard(ctx, game.lastPlay.card, 1080, 62);
  }
}

function drawPlayerRow(ctx, game, ui) {
  const me = game.player;
  hpBar(ctx, 40, 414, 330, 'YOU', me.hp, me.block);
  manaPips(ctx, 40, 458, me.mana);
  text(ctx, `SCORE ${scoreOf(me)}   •   DECK ${me.deck.draw.length}   •   TURN ${game.turn}`, 1010, 420, 13, '#e8e0c8', 'right', 700);
  text(ctx, 'YOUR HAND — click a card to play it', 640, 448, 13, '#ffe9a8', 'center', 700);
  const rects = playerHandRects(game);
  rects.forEach((r) => {
    const card = cardDef(r.id);
    const affordable = card.cost <= me.mana && game.phase === 'play' && game.active === 'player';
    drawCard(ctx, card, r.x, r.y, r.w, r.h, ui.hover === r.index ? 26 : 0, !affordable);
  });
  text(ctx, 'Click a card to play · keys 1–7 play · Space = End Turn · M = mute', 640, 700, 12, '#b9ac86', 'center', 400);
}

function drawMiddle(ctx, game, ui) {
  const btn = endTurnRect();
  const active = game.phase === 'play' && game.active === 'player';
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.fillStyle = active ? '#c9a227' : '#5c5340';
  ctx.fill();
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, active ? 'END TURN  ⏎' : 'ASH IS THINKING…', btn.x + btn.w / 2, btn.y + 30, 18, active ? '#241a00' : '#d8d2bd', 'center', 800);
  game.log.slice(-3).forEach((line, i) => {
    text(ctx, line, 40, 250 + i * 26, 14, i === 2 ? '#ffffff' : '#cbbf9a', 'left', i === 2 ? 700 : 400);
  });
  text(ctx, 'Chain rule: play 2 cards of the same suit in one turn for a bonus —', 40, 340, 12, '#b9ac86', 'left', 400);
  text(ctx, 'Ember +2 dmg · Tide draw 1 · Thorn heal 3 · Stone +4 block', 40, 360, 12, '#ffe9a8', 'left', 700);
}

function drawFloats(ctx, game) {
  game.floats.forEach((f) => {
    // Anchors sit just past the end of each life bar, never on top of it.
    const base = f.who === 'player' ? { x: 410, y: 425 } : { x: 530, y: 107 };
    const alpha = Math.max(0, 1 - f.age);
    ctx.globalAlpha = alpha;
    const color = f.kind === 'damage' ? '#ff6b4a' : f.kind === 'heal' ? '#7dff9a' : '#9ecfff';
    text(ctx, f.text, base.x, base.y - f.age * 46, 24, color, 'center', 800);
    ctx.globalAlpha = 1;
  });
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(8,20,12,0.82)';
  ctx.fillRect(0, 0, TABLE_W, TABLE_H);
  text(ctx, '▲  EMBER DUEL  ▲', 640, 128, 64, '#ffd166', 'center', 800);
  text(ctx, 'A 30-card duel of fire, tide, thorn and stone', 640, 182, 20, '#fdf6e3', 'center', 400);
  const feats = [
    '30 CARDS · 12 DESIGNS · 4 SUITS — Ember, Tide, Thorn, Stone',
    'SUIT CHAINS — two of a suit in one turn triggers a bonus',
    'SMART RIVAL — Ash guards when hurt, saves finishers, goes lethal',
    '30 LIFE EACH · MANA THAT GROWS EVERY TURN · SCORE THAT COUNTS',
  ];
  feats.forEach((f, i) => text(ctx, f, 640, 246 + i * 34, 16, '#e8e0c8', 'center', 600));
  text(ctx, 'How to play: click a card (or press 1–7) to play it, then End Turn.', 640, 420, 15, '#b9ac86', 'center', 400);
  text(ctx, 'Block soaks damage for a turn. Chains reward same-suit pairs.', 640, 446, 15, '#b9ac86', 'center', 400);
  text(ctx, game.taunt || '“Your ember is small. Mine has burned a hundred duels.”', 640, 492, 15, '#ff9a7a', 'center', 400);
  const btn = beginRect();
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.fillStyle = '#c9a227';
  ctx.fill();
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '▶  SIT DOWN & DUEL', btn.x + btn.w / 2, btn.y + 33, 22, '#241a00', 'center', 800);
  text(ctx, 'Click or press Enter — keyboard + mouse, offline, no account', 640, 622, 12, '#b9ac86', 'center', 400);
}

function drawEnd(ctx, game, won) {
  ctx.fillStyle = won ? 'rgba(20,26,4,0.86)' : 'rgba(20,6,4,0.86)';
  ctx.fillRect(0, 0, TABLE_W, TABLE_H);
  text(ctx, won ? '★  VICTORY  ★' : 'DEFEAT', 640, 150, 66, won ? '#ffd166' : '#c96a5a', 'center', 800);
  text(
    ctx,
    won ? 'Ash’s ember gutters out. The table is yours.' : 'Your ember gutters out. Ash keeps the table — for now.',
    640, 210, 19, '#fdf6e3', 'center', 400,
  );
  const me = game.player;
  const foe = game.foe;
  const stats = [
    `FINAL SCORE — YOU ${scoreOf(me)}  ·  ASH ${scoreOf(foe)}`,
    `LIFE — YOU ${me.hp}  ·  ASH ${foe.hp}`,
    `DAMAGE DEALT — ${me.damageDealt}   ·   CARDS PLAYED — ${me.cardsPlayed}`,
    `SUIT CHAINS — ${me.chains}   ·   TURNS — ${game.turn}`,
  ];
  stats.forEach((s, i) => text(ctx, s, 640, 286 + i * 36, 17, '#e8e0c8', 'center', 600));
  const btn = againRect();
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.fillStyle = '#c9a227';
  ctx.fill();
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '↻  DUEL AGAIN  (R)', btn.x + btn.w / 2, btn.y + 33, 22, '#241a00', 'center', 800);
  text(ctx, won ? 'Top-10 games are playable on makefun.gg — this one is ready.' : 'Same deck, same seed, new shuffle — the rematch is a click away.', 640, 640, 12, '#b9ac86', 'center', 400);
}

function drawTopBar(ctx, game) {
  text(ctx, 'EMBER DUEL', 40, 40, 20, '#ffd166', 'left', 800);
  text(ctx, game.phase === 'play' ? `TURN ${game.turn} — ${game.active === 'player' ? 'YOUR MOVE' : 'ASH’S MOVE'}` : '', 640, 40, 16, '#e8e0c8', 'center', 700);
  text(ctx, '30 cards · 12 designs · 4 suits', 1240, 40, 12, '#b9ac86', 'right', 600);
}

/** Draw the whole game for the current phase. `ui` carries hover + floats. */
export function renderGame(ctx, game, ui) {
  ctx.clearRect(0, 0, TABLE_W, TABLE_H);
  drawTable(ctx);
  drawTopBar(ctx, game);
  if (game.phase === 'title') {
    drawFoeRow(ctx, game);
    drawPlayerRow(ctx, game, ui);
    drawTitle(ctx, game);
    return;
  }
  drawFoeRow(ctx, game);
  drawMiddle(ctx, game, ui);
  drawPlayerRow(ctx, game, ui);
  drawFloats(ctx, game);
  if (game.phase === 'win') drawEnd(ctx, game, true);
  if (game.phase === 'loss') drawEnd(ctx, game, false);
}


