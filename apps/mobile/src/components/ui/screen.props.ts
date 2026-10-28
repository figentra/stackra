/**
 * Stackra file contract:
 * Purpose: `ScreenProps`: props of `Screen`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode, Ref } from "react";
import type { ScrollView } from "react-native";

/** Props of {@link Screen}. */
export interface ScreenProps {
  /** The screen's content. */
  children: ReactNode;
  /** The scroll view, for a screen that scrolls itself (to a section). */
  ref?: Ref<ScrollView>;
  /** True to draw the screen on the ambient field, under the glass header and tab bar; otherwise the solid background. */
  isAmbient?: boolean;
}
