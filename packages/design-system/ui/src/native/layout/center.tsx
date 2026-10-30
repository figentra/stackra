/**
 * Stackra file contract:
 * Purpose: the native `Center`: a column centred in its container, capped at a reading measure, with a gutter on both
 *          sides.
 * Boundary: a plain `View` centred with `self-center`; the same in right-to-left. Passes every `View` prop through.
 *           `isTextCentered` centres the column's children; a `Text` inside still sets its own alignment.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { CenterProps } from "#native/layout/center.props";

/** The cap of each width. */
const MAX = {
  sm: "max-w-sm",
  md: "max-w-lg",
  prose: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

/** A centred column. */
export function Center({
  children,
  maxWidth = "prose",
  isTextCentered = false,
  className,
  ...rest
}: CenterProps): ReactElement {
  return (
    <View
      {...rest}
      className={[
        "w-full self-center px-4",
        MAX[maxWidth],
        isTextCentered && "items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </View>
  );
}
