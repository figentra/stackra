/**
 * Stackra file contract:
 * Purpose: the native `SingleColumnLayout`, an adapted form: the frame of a screen's content with one column, a `View`
 *          that stacks its children (usually Sections) with an even gap; every `View` prop passes through.
 * Boundary: HeroUI Native has no page layout, so this is a plain `View` with the `gap-3` the web layout uses, and it
 *           imports no sibling piece of wave 6 (ADR 0317 decision 4). A string or number child is drawn inside `Text`,
 *           since React Native refuses a bare string in a `View`. It draws no landmark and no heading.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0317 (decision 7).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { Text } from "#native/text/text";
import type { SingleColumnLayoutProps } from "#native/single-column-layout/single-column-layout.props";

/** A screen of one column: its children stacked from top to bottom with a gap. */
export function SingleColumnLayout({
  children,
  className,
  ...rest
}: SingleColumnLayoutProps): ReactElement {
  return (
    <View {...rest} className={["gap-3", className].filter(Boolean).join(" ")}>
      {typeof children === "string" || typeof children === "number" ? (
        <Text>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
