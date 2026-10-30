/**
 * Stackra file contract:
 * Purpose: the native `Cluster`: items in a row that wraps onto the next line when it runs out of room, with an even
 *          gap.
 * Boundary: a plain `View`; React Native lays a row from the start side, so it mirrors in right-to-left. Passes every
 *           `View` prop through.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (wave C).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { SPACE_GAP_CLASS } from "#core/constants/space-gap-class.constant";
import type { ClusterProps } from "#native/layout/cluster.props";

/** The cross-axis class of each alignment. */
const ALIGN = {
  center: "items-center",
  start: "items-start",
  end: "items-end",
  baseline: "items-baseline",
} as const;

/** The main-axis class of each justification. */
const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

/** Items in a wrapping row. */
export function Cluster({
  children,
  gap = "sm",
  align = "center",
  justify = "start",
  className,
  ...rest
}: ClusterProps): ReactElement {
  return (
    <View
      {...rest}
      className={[
        "flex-row flex-wrap",
        SPACE_GAP_CLASS[gap],
        ALIGN[align],
        JUSTIFY[justify],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </View>
  );
}
