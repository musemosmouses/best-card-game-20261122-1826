// EMBER DUEL — seeded randomness. Every shuffle and every AI tie-break comes
// from here, so the same seed always deals the same game. No Date, no
// Math.random in game logic: the only clock in the entry drives animation.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by a seeded rng; returns a new array. */
export function seededShuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Pick one of `choices` with a seeded rng (AI tie-breaks use this). */
export function seededPick(choices, rng) {
  return choices[Math.floor(rng() * choices.length)];
}

