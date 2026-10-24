/**
 * Stackra file contract:
 * Purpose: the native `TwoColumnLayout`, an adapted form: a phone has one column, so the main column's blocks are
 *          followed by the side column's, stacked with an even gap in a single `View`. `collapseBelow` is accepted and
 *          ignored, since native has no width to switch on (ADR 0317 decision 6); every `View` prop passes through.
 * Boundary: HeroUI Native has no page layout, so this is a plain `View` with the `gap-3` the web layout uses, and it
 *           imports no sibling piece of wave 6 (ADR 0317 decision 4). The main column is first, as on web, so the
 *           reading order is the same. A string or number in either column is drawn inside `Text`, since React Native
 *           refuses a bare string in a `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0317 (decisions 6 and 7).
 */
import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import type { TwoColumnLayoutContractProps } from "#contracts/types/two-column-layout-contract-props.type";
import { Text } from "#native/text/text";

/** Props of the native TwoColumnLayout: the shared contract plus the `View`'s own props, passed through. */
export type TwoColumnLayoutProps = TwoColumnLayoutContractProps &
  Omit<ViewProps, keyof TwoColumnLayoutContractProps>;

/** A node as the layout can draw it: a string or number goes inside `Text`, any other node as it is. */
function textual(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;
}

/** A screen of a main column and a side column, stacked because a phone has no room beside. */
export function TwoColumnLayout({
  aside,
  children,
  collapseBelow: _collapseBelow,
  className,
  ...rest
}: TwoColumnLayoutProps): ReactElement {
  return (
    <View {...rest} className={["gap-3", className].filter(Boolean).join(" ")}>
      {textual(children)}
      {textual(aside)}
    </View>
  );
}
