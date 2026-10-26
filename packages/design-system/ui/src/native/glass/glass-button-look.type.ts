/**
 * Stackra file contract:
 * Purpose: `GlassButtonLook`: what a glass variant hands HeroUI Native's button.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0319 (decisions 2 and 3); ADR 0320
 *          (decision 7); ADR 0302 (decision 3).
 */
import type { ReactNode } from "react";

/** What a glass variant hands HeroUI Native's button. */
export interface GlassButtonLook {
  /** The layer HeroUI Native draws behind the content, inside the button's radius. */
  readonly background: ReactNode;
  /** Clears the variant's own fill so the layer shows. */
  readonly className: string;
}
