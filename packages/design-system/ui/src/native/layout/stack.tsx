/**
 * Stackra file contract:
 * Purpose: the native `Stack`: children in a column with an even gap from the spacing scale.
 * Boundary: a plain `View`, no surface; passes every `View` prop through.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29, wave C).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { SPACE_GAP_CLASS } from "#core/constants/space-gap-class.constant";
import type { StackProps } from "#native/layout/stack.props";

/** The cross-axis class of each alignment. */
const ALIGN = {
  stretch: "items-stretch",
  start: "items-start",
  center: "items-center",
  end: "items-end",
} as const;

/** Blocks in a column with an even gap. */
export function Stack({
  children,
  gap = "md",
  align = "stretch",
  className,
  ...rest
}: StackProps): ReactElement {
  return (
    <View
      {...rest}
      className={["flex-col", SPACE_GAP_CLASS[gap], ALIGN[align], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </View>
  );
}
