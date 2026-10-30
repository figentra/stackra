/**
 * Stackra file contract:
 * Purpose: `STUDIO_PRESETS`: the presets: an id and the knobs it sets. The first, `base`, is the picked brand's (or the
 *          imported) theme as it is, and is labelled with its name; the others' labels are catalogue words.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10).
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";

/** The presets: an id and the knobs it sets. */
export const STUDIO_PRESETS: readonly {
  id: "base" | "ember" | "moss" | "violet";
  knobs: ThemeKnobs;
}[] = [
  { id: "base", knobs: {} },
  {
    id: "ember",
    knobs: {
      accent: { hue: 40, chroma: 0.16 },
      neutralHue: 60,
      neutralChroma: 0.008,
      radius: 8,
    },
  },
  {
    id: "moss",
    knobs: {
      accent: { hue: 150, chroma: 0.12 },
      neutralHue: 140,
      neutralChroma: 0.008,
      radius: 6,
    },
  },
  {
    id: "violet",
    knobs: {
      accent: { hue: 295, chroma: 0.15 },
      neutralHue: 290,
      neutralChroma: 0.01,
      radius: 12,
    },
  },
];
