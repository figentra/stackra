/**
 * Stackra file contract:
 * Purpose: `GLASS_CLEAR_DIM_FLOORS`: the least black dim under clear glass, by what the glass holds. White over a
 *          pure-white frame dimmed by `d`, through 8-bit sRGB: 0.35 (Apple's default) gives 2.4:1 and fails; 0.50
 *          gives 4.0:1, which holds glyphs (3:1, WCAG 1.4.11); 0.55 gives 4.75:1, which holds labels (4.5:1, WCAG
 *          1.4.3). Owner decision 2026-10-31: the safe floors, enforced by the contrast test.
 * Boundary: data only; `renderWebCss` and native `GlassSurface` never draw a dim below these.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 4 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */

/** The least dim under clear glass: behind glyphs only, and behind a label. */
export const GLASS_CLEAR_DIM_FLOORS = Object.freeze({ glyph: 0.5, label: 0.55 } as const);
