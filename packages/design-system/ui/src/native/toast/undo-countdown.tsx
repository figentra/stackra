/**
 * Stackra file contract:
 * Purpose: the native `UndoCountdown`, the undo toast's indicator: the whole seconds left, in the customer's digits,
 *          inside an accent ring, counting down once a second until the toast closes.
 * Boundary: internal, not in the `native` barrel; the native `toast.undo` hands it to `ToastItem`. Hidden from
 *           assistive technology (the message and the "Undo" button carry the meaning). A changing digit is not
 *           motion, so it counts at every motion level; HeroUI Native has no hover pause to follow.
 * Runtime: react-native
 * Governing contract: WCAG 2.2 SC 2.2.1; ADR 0329; STA-1371 (owner request 2026-10-29).
 */
import { useEffect, useState, type ReactElement } from "react";
import { View } from "react-native";

import { useNumberFormat } from "#native/hooks/use-number-format";
import { Text } from "#native/text/text";
import type { UndoCountdownProps } from "#native/toast/undo-countdown.props";

/** The seconds left, in a ring. */
export function UndoCountdown({ duration }: UndoCountdownProps): ReactElement {
  const format = useNumberFormat();
  const [left, setLeft] = useState(Math.ceil(duration / 1000));
  useEffect(() => {
    const timer = setInterval(() => setLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="size-6 items-center justify-center rounded-[var(--radius-pill)] border-2 border-accent"
    >
      <Text type="small" className="text-xs font-medium text-accent tabular-nums">
        {format(left)}
      </Text>
    </View>
  );
}
