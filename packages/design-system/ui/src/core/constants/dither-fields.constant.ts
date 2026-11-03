/**
 * Stackra file contract:
 * Purpose: `DITHER_FIELDS`, the six brand pattern fields. A field maps a cell (x and y in 0..1, time t in seconds, the
 *          aspect w/h) to two channels, [steel, core], each 0..1; steel is capped below 1 so it always dithers and
 *          never fills flat.
 * Boundary: pure maths, no DOM. Ported as it is from the brand kit's generator (see ORIGIN.md), so the canvas draws
 *           the same art as the kit's posters.
 * Runtime: isomorphic
 * Governing contract: brand rules §40; ADR 0302 (decision 3); STA-2041.
 */
import type { DitherPattern } from "#contracts/enums/dither-pattern.enum";

/** A field: the [steel, core] channels of one cell. */
type Field = (x: number, y: number, t: number, aspect: number) => readonly [number, number];

const hash = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43_758.5453;
  return s - Math.floor(s);
};

/** Smooth value noise, 0..1. */
const noise = (x: number, y: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

/** Three octaves of value noise, 0..1. */
const fbm = (x: number, y: number): number =>
  noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;

const clamp = (n: number, max = 1): number => Math.min(max, Math.max(0, n));

/** The steel channel's ceiling: above it the dither would close into flat areas. */
const STEEL = 0.6;

/** A gaussian glow that reaches exactly zero at its edge, so a faint tail never leaves stray core dots. */
const glow = (dx: number, dy: number, kx: number, ky: number): number =>
  Math.max(0, (Math.exp(-(dx * dx * kx + dy * dy * ky)) - 0.04) / 0.96);

/** The six patterns; each meaning is in the brand book, chapter 07. */
export const DITHER_FIELDS: Readonly<Record<DitherPattern, Field>> = Object.freeze({
  // The primary: the framework's floors, bent by noise, over the engine core glowing at the base.
  strata(x, y, t) {
    const f = fbm(x * 3 + t * 0.02, y * 3 - t * 0.01);
    const floors = 0.5 + 0.5 * Math.sin((y * 6.5 + f * 0.9) * Math.PI);
    return [
      clamp(floors ** 2.5 * 0.8 * (0.3 + y * 0.7) + (f - 0.5) * 0.2, STEEL),
      clamp(glow(x - 0.5, y - 1.04, 7, 8)),
    ];
  },
  // Ignition: one action starting the engine, a core dithering out through steel rings.
  core(x, y, t, aspect) {
    const dx = (x - 0.5) * aspect;
    const dy = y - 0.5;
    const r = Math.sqrt(dx * dx + dy * dy);
    const f = fbm(x * 4 + t * 0.02, y * 4);
    const core = Math.exp(-r * r * 14) * 1.05;
    const rings = 0.5 + 0.5 * Math.sin(r * 28 - t * 0.5);
    return [clamp(rings * 0.4 * (1 - Math.min(1, core)) + (f - 0.5) * 0.15, STEEL), clamp(core)];
  },
  // gen: code written from models, blocky cells with the core at the side where the output appears.
  grid(x, y, t) {
    const f = fbm(x * 4 + t * 0.03, y * 4);
    const cell = (Math.floor(x * 16) + Math.floor(y * 6)) % 3 === 0 ? 0.55 : 0.12;
    return [clamp(cell * (0.35 + f * 0.6), STEEL), clamp(glow(x - 0.9, y - 0.5, 14, 10) * 0.85)];
  },
  // Runway: three environments as lanes, one change moving along the middle lane as a core pulse.
  lanes(x, y, t) {
    const f = fbm(x * 6 + t * 0.02, y * 2);
    const lane = Math.max(...[1 / 6, 0.5, 5 / 6].map((c) => Math.exp(-(y - c) * (y - c) * 300)));
    const pulse = glow(x - (0.68 + 0.05 * Math.sin(t * 0.3)), y - 0.5, 40, 300) * 0.95;
    return [clamp(lane * 0.55 + (f - 0.5) * 0.08, STEEL), clamp(pulse)];
  },
  // Flow: long, slow bands, spec to merge. No core.
  waves(x, y, t) {
    const f = fbm(x * 3, y * 3 + t * 0.01);
    const w =
      0.5 +
      0.5 *
        Math.sin((x * 2.2 + 0.35 * Math.sin(y * 3 + f * 2) + y * 0.6) * Math.PI * 3.2 + t * 0.2);
    return [clamp(w ** 2 * 0.65 + (f - 0.5) * 0.1, STEEL), 0];
  },
  // A quiet field for backgrounds: low-contrast noise, steel only.
  field(x, y, t) {
    return [clamp((fbm(x * 5 + t * 0.01, y * 5) - 0.35) * 0.5, STEEL), 0];
  },
});
