/**
 * PenFlow — Procedural Handwriting Variation Engine
 *
 * Assigns per-character variation vectors (height, width, rotation, baseline
 * offset, spacing, velocity) so that rendered glyphs look naturally handwritten.
 * All randomness is seeded so the same document + seed always renders identically.
 */

// ---------- Seeded PRNG (mulberry32) ----------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------- Style presets ----------
// Each style defines the ranges of organic variation a real writer would show.
export const STYLES = {
  neatStudent: {
    name: "Neat Student",
    sizeJitter: 0.03, widthJitter: 0.03, rotation: 0.5, baselineJitter: 0.6,
    wordSpacing: 1.0, letterSpacing: 0.0, slant: -0.06, speed: 0.9, pressure: 0.8,
  },
  fastClassroom: {
    name: "Fast Classroom Notes",
    sizeJitter: 0.08, widthJitter: 0.07, rotation: 1.8, baselineJitter: 1.6,
    wordSpacing: 0.85, letterSpacing: -0.04, slant: -0.14, speed: 1.35, pressure: 0.55,
  },
  cursive: {
    name: "Cursive",
    sizeJitter: 0.05, widthJitter: 0.06, rotation: 1.2, baselineJitter: 1.0,
    wordSpacing: 1.15, letterSpacing: -0.02, slant: -0.22, speed: 1.0, pressure: 0.7,
  },
  examHandwriting: {
    name: "Exam Handwriting",
    sizeJitter: 0.06, widthJitter: 0.05, rotation: 1.4, baselineJitter: 1.3,
    wordSpacing: 0.9, letterSpacing: -0.03, slant: -0.1, speed: 1.25, pressure: 0.6,
  },
  teacher: {
    name: "Teacher Handwriting",
    sizeJitter: 0.04, widthJitter: 0.04, rotation: 0.8, baselineJitter: 0.8,
    wordSpacing: 1.1, letterSpacing: 0.02, slant: -0.08, speed: 0.85, pressure: 0.9,
  },
  calligraphy: {
    name: "Calligraphy",
    sizeJitter: 0.02, widthJitter: 0.03, rotation: 0.4, baselineJitter: 0.4,
    wordSpacing: 1.25, letterSpacing: 0.03, slant: -0.04, speed: 0.7, pressure: 1.0,
  },
  engineering: {
    name: "Engineering Notes",
    sizeJitter: 0.05, widthJitter: 0.04, rotation: 1.0, baselineJitter: 1.0,
    wordSpacing: 0.95, letterSpacing: 0.01, slant: -0.05, speed: 1.1, pressure: 0.75,
  },
  messyRough: {
    name: "Messy Rough Notes",
    sizeJitter: 0.12, widthJitter: 0.1, rotation: 3.0, baselineJitter: 2.5,
    wordSpacing: 0.75, letterSpacing: -0.05, slant: -0.18, speed: 1.5, pressure: 0.45,
  },
};

export const DEFAULT_STYLE = STYLES.neatStudent;

// ---------- Variation engine ----------

/**
 * Generate per-character variation data for a block of text.
 *
 * @param {string} text        The text to vary
 * @param {object} style       A style preset from STYLES
 * @param {number} seed        Global randomness seed (0 = auto)
 * @returns {{chars: Array, rand: Function}} variation data
 */
export function varyText(text, style = DEFAULT_STYLE, seed = 0) {
  const rand = mulberry32(seed === 0 ? hashString(text) : seed);
  const r = (lo, hi) => lo + rand() * (hi - lo);

  const chars = [];
  let wordPos = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isWordStart = i === 0 || text[i - 1] === " ";
    if (isWordStart) wordPos++;

    chars.push({
      ch,
      // glyph geometry
      size: 1 + r(-style.sizeJitter, style.sizeJitter),
      width: 1 + r(-style.widthJitter, style.widthJitter),
      rotation: r(-style.rotation, style.rotation),
      baseline: r(-style.baselineJitter, style.baselineJitter),
      // spacing
      wordGap: isWordStart ? r(0.7, 1.3) * style.wordSpacing : 0,
      letterGap: 1 + r(-0.05, 0.05) + style.letterSpacing,
      // motion
      slant: style.slant + r(-0.03, 0.03),
      speed: style.speed * r(0.8, 1.2),
      pressure: style.pressure * r(0.75, 1.1),
      // occasional re-trace (letter re-drawn, like a real pen hesitation)
      retraced: rand() < 0.015,
      // occasional strikethrough correction (messy styles)
      corrected: style.sizeJitter > 0.08 && rand() < 0.004,
    });
  }

  return { chars, rand };
}

/**
 * Measure the rendered width of a text run in pixels given a base font size.
 * Accounts for per-character variation gaps.
 */
export function measureText(text, fontSize, style = DEFAULT_STYLE, seed = 0) {
  const { chars } = varyText(text, style, seed);
  let width = 0;
  for (const c of chars) {
    const base = fontSize * c.width * c.letterGap;
    width += c.wordGap * fontSize * 0.5 + base;
  }
  return width;
}

export { mulberry32, hashString };
