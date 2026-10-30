/**
 * Stackra file contract:
 * Purpose: `MARK_PAINT`, how the web charts light and tone their data marks: the top light's strength (from the
 *          theme's material highlight, so a flat brand stays flat), the soft tone context marks stand back in, and
 *          the opacity the other marks dim to while one is pointed.
 * Boundary: values only, written into SVG presentation attributes and inline colours; no shadow or glow on a mark.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0320 (the glass material); STA-1371.
 */
import { CHART_CONTEXT_SHARE } from "#core/constants/chart-context-share.constant";

/** The marks' light and tones. */
export const MARK_PAINT = {
  /**
   * 0 to 1: how lit a mark's top is. The material highlight share is 0.7 light and 0.09 dark in the Stackra theme
   * and 0 in a flat brand; times ten, clamped, both lit schemes light fully and a flat brand not at all.
   */
  lift: "clamp(0, var(--material-highlight-share, 0) * 10, 1)",
  /** The share of white mixed into a fully lit mark's top. */
  topWhite: 16,
  /** The share of a mark's colour in the soft fill of a context mark, the rest the card's surface. */
  contextShare: CHART_CONTEXT_SHARE * 100,
  /** A context mark's 1px outline: the field border, 3:1 or more on the card, so its edge holds WCAG 1.4.11. */
  contextEdge: "var(--field-border)",
  /** The other marks' opacity while one is pointed. */
  dimOpacity: 0.45,
} as const;
