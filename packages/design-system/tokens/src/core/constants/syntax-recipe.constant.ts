/**
 * Stackra file contract:
 * Purpose: `SYNTAX_RECIPE`, how each syntax role is coloured: an OKLCH hue (`accent` takes the theme's accent hue,
 *          `neutral` the code background's), a chroma, and a starting lightness per scheme. `syntaxColours` then moves
 *          the lightness away from the background until the role holds `SYNTAX_MIN_CONTRAST` on it.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); WCAG 2.2 SC 1.4.3; STA-1371.
 */
/**
 * The recipe: each role's hue, chroma and starting lightness (light, dark), GitHub-like hues so code reads familiar
 * under any brand; the ratio each role keeps on the code background and its line tints (AA's 4.5:1 and a little
 * rounding slack); and the share a highlighted (accent), inserted or deleted line's tint takes over the background.
 */
export const SYNTAX_RECIPE = {
  roles: {
    keyword: { hue: "accent", chroma: 0.17, lightness: [0.5, 0.8] },
    string: { hue: 150, chroma: 0.14, lightness: [0.5, 0.82] },
    number: { hue: 55, chroma: 0.15, lightness: [0.55, 0.82] },
    function: { hue: 300, chroma: 0.16, lightness: [0.5, 0.8] },
    type: { hue: 200, chroma: 0.12, lightness: [0.5, 0.82] },
    variable: { hue: 250, chroma: 0.13, lightness: [0.5, 0.82] },
    comment: { hue: "neutral", chroma: 0.015, lightness: [0.62, 0.62] },
    punctuation: { hue: "neutral", chroma: 0.01, lightness: [0.42, 0.78] },
    tag: { hue: 25, chroma: 0.16, lightness: [0.52, 0.78] },
    attribute: { hue: 80, chroma: 0.13, lightness: [0.55, 0.84] },
    operator: { hue: 15, chroma: 0.12, lightness: [0.5, 0.8] },
    inserted: { hue: 145, chroma: 0.15, lightness: [0.5, 0.82] },
    deleted: { hue: 25, chroma: 0.17, lightness: [0.5, 0.78] },
  },
  minContrast: 4.6,
  lineTint: 0.1,
} as const;
