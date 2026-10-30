/**
 * Stackra file contract:
 * Purpose: `ShowcaseToastStyle`, the look and the place along the edge of the app's one toast stack, and the calls the
 *          toast "styles" demo uses to change them.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */
import type { ToastAlign, ToastVariant } from "@stackra/ui/contracts";

/** The app's toast stack style and its setters. */
export interface ShowcaseToastStyle {
  /** The look of every toast. */
  readonly variant: ToastVariant;
  /** Where along the edge the stack sits. */
  readonly align: ToastAlign;
  /** Picks the look. */
  readonly setVariant: (variant: ToastVariant) => void;
  /** Picks the place along the edge. */
  readonly setAlign: (align: ToastAlign) => void;
}
