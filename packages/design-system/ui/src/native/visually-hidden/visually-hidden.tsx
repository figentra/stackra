/**
 * Stackra file contract:
 * Purpose: the native `VisuallyHidden`: a `Text` VoiceOver and TalkBack read and the screen does not show, clipped to
 *          one transparent point outside the layout. Prefer an `accessibilityLabel` on the element itself; this is for
 *          text that must sit in the reading order, such as a section's context or a list's count.
 * Boundary: never `opacity: 0` or `display: none`, which hide it from screen readers too.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0165.
 */
import { StyleSheet, Text } from "react-native";
import type { ReactElement } from "react";

import type { VisuallyHiddenProps } from "#native/visually-hidden/visually-hidden.props";

/** One transparent point, out of the flow. */
const STYLES = StyleSheet.create({
  hidden: { position: "absolute", width: 1, height: 1, overflow: "hidden", color: "transparent" },
});

/** Content for screen readers only. */
export function VisuallyHidden({ children, ...rest }: VisuallyHiddenProps): ReactElement {
  return (
    <Text {...rest} style={STYLES.hidden}>
      {children}
    </Text>
  );
}
