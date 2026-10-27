/**
 * Stackra file contract:
 * Purpose: `THEME_PRESETS`: the presets: the same names and knobs as the playground's Theme Studio.
 * Boundary: data only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";

/** The presets: the same names and knobs as the playground's Theme Studio. */
export const THEME_PRESETS: readonly { id: string; label: string; knobs: ThemeKnobs }[] = [
  { id: "stackra", label: "Stackra", knobs: {} },
  {
    id: "steel",
    label: "Steel",
    knobs: { accent: { hue: 248, chroma: 0.09 }, neutralHue: 248, neutralChroma: 0.012 },
  },
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
