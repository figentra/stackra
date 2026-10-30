/**
 * Stackra file contract:
 * Purpose: `contrastReport`, the contrast of the theme's main pairs in one scheme, each against the ratio WCAG 2.2 AA
 *          needs, as the web studio measures them.
 * Boundary: a pure function over @stackra/tokens' `pairRatio`, which composites a translucent colour (dark mode's
 *           `#FFFFFFE0`) over the page first; a pair it cannot measure is left out.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10). WCAG 2.2 SC
 *                     1.4.3, 1.4.11.
 */
import { pairRatio } from "@stackra/tokens";
import type { ColorRole, Theme } from "@stackra/tokens/contracts";

/** The pairs the contrast readout measures, as the web studio does, and the ratio each needs. */
const CONTRAST_PAIRS: readonly { name: string; fg: ColorRole; bg: ColorRole; needs: 4.5 | 3 }[] = [
  { name: "Text on background", fg: "foreground", bg: "background", needs: 4.5 },
  { name: "Muted text on background", fg: "muted", bg: "background", needs: 4.5 },
  { name: "Text on surface", fg: "surface-foreground", bg: "surface", needs: 4.5 },
  { name: "Accent label", fg: "accent-foreground", bg: "accent", needs: 4.5 },
  { name: "Link on background", fg: "link", bg: "background", needs: 4.5 },
  { name: "Field text", fg: "field-foreground", bg: "field-background", needs: 4.5 },
  { name: "Danger label", fg: "danger-foreground", bg: "danger", needs: 4.5 },
  { name: "Field edge", fg: "field-border", bg: "field-background", needs: 3 },
  { name: "Focus ring", fg: "focus", bg: "background", needs: 3 },
];

/** The contrast of the theme's main pairs in `scheme`, each against the ratio it needs. */
export function contrastReport(theme: Theme, scheme: "light" | "dark") {
  return CONTRAST_PAIRS.flatMap(({ name, fg, bg, needs }) => {
    const ratio = pairRatio(theme, { fg, bg, min: needs }, scheme);
    return ratio === undefined ? [] : [{ name, ratio, needs, isPassing: ratio >= needs }];
  });
}
