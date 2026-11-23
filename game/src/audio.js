// EMBER DUEL — synthesized sound effects. WebAudio only, no audio files:
// short oscillator blips with an envelope, one tiny helper per event.
let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function sfxPlay() {
  blip(520, 0.09, 'triangle', 0.12, 780);
}

export function sfxDraw() {
  blip(660, 0.06, 'sine', 0.08, 880);
}

export function sfxHit() {
  blip(180, 0.16, 'sawtooth', 0.14, 70);
}

export function sfxBlock() {
  blip(300, 0.1, 'square', 0.07, 220);
}

export function sfxHeal() {
  blip(440, 0.18, 'sine', 0.1, 660);
}

export function sfxChain() {
  blip(740, 0.08, 'triangle', 0.11, 990);
  setTimeout(() => blip(990, 0.1, 'triangle', 0.11, 1320), 70);
}

export function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.13), i * 110));
}

export function sfxLose() {
  [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.24, 'sawtooth', 0.08), i * 130));
}

export function sfxClick() {
  blip(880, 0.04, 'sine', 0.06);
}

