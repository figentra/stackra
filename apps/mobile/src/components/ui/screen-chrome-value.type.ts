/**
 * Stackra file contract:
 * Purpose: `ScreenChromeValue`: what a wrapper draws before and after a screen's content, inside its scroll.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0305 (rule 10).
 */
import { type ReactNode } from "react";

/** What a wrapper draws before and after a screen's content, inside its scroll. */
export interface ScreenChromeValue {
  /** Drawn above the content. */
  top?: ReactNode;
  /** Drawn below the content. */
  bottom?: ReactNode;
}
