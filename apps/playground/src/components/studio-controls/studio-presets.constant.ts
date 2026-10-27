/**
 * Stackra file contract:
 * Purpose: `STUDIO_PRESETS`: the presets: a name and the knobs it sets.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10).
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";

/** The presets: a name and the knobs it sets. Stackra is the theme as shipped, with its steel-blue accent. */
export const STUDIO_PRESETS: readonly { id: string; label: string; knobs: ThemeKnobs }[] = [
  { id: "stackra", label: "Stackra", knobs: {} },
  {
    id: "ember",
    label: "Ember",
    knobs: { accent: { hue: 40, chroma: 0.16 }, neutralHue: 60, neutralChroma: 0.008, radius: 8 },
  },
  {
    id: "moss",
    label: "Moss",
    knobs: { accent: { hue: 150, chroma: 0.12 }, neutralHue: 140, neutralChroma: 0.008, radius: 6 },
  },
  {
    id: "violet",
    label: "Violet",
    knobs: { accent: { hue: 295, chroma: 0.15 }, neutralHue: 290, neutralChroma: 0.01, radius: 12 },
  },
];
