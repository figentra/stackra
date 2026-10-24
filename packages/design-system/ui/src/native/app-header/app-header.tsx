/**
 * Stackra file contract:
 * Purpose: the native `AppHeader`, an adapted form: a bar for a screen that wants the console's vocabulary. A row
 *          holding `startContent`, the `title` (the app's name or logo), the `search` slot taking the room left over,
 *          `endContent` and the `userMenu`, in that order from the inline start, so right-to-left mirrors it with the
 *          row itself. `label` names the bar.
 * Boundary: HeroUI Native has no application bar, and on a phone the navigator's own header is the bar
 *           (`NavigationHeader`), so this is a plain `View` row on theme tokens. It imports no other shell piece: each
 *           part is a node (ADR 0317 decision 4). A string or number in any slot is drawn inside `Text` (semibold for
 *           the title), since React Native refuses a bare string in a `View`. The row takes the `banner` role, the nearest
 *           landmark React Native has, as the web bar is a `header`. It is not itself an accessibility element, so
 *           each control inside stays its own stop for a screen reader and a platform that skips unfocusable
 *           containers may never speak `label`; the name is the same one the web bar gets, not a promise of
 *           announcement. It draws no safe-area inset: the screen or navigator that holds it owns the status bar.
 *           Extra props pass to the root `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); WCAG
 *          2.2 SC 1.3.1 and 2.5.8.
 */
import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import type { AppHeaderContractProps } from "#contracts/types/app-header-contract-props.type";
import { Text } from "#native/text/text";

/**
 * Props of the native AppHeader: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type AppHeaderProps = AppHeaderContractProps &
  Omit<ViewProps, keyof AppHeaderContractProps | "accessibilityLabel" | "children">;

/** A node as the bar can draw it: a string or number goes inside `Text`, any other node as it is. */
function textual(node: ReactNode, className?: string): ReactNode {
  return typeof node === "string" || typeof node === "number" ? (
    <Text {...(className ? { className } : {})} numberOfLines={1}>
      {node}
    </Text>
  ) : (
    node
  );
}

/**
 * The top bar of a screen: start slot, title, search, end slot and user menu. The search slot takes the room left
 * over, so the end slot and the user menu stay at the inline end whether or not there is a search.
 */
export function AppHeader({
  title,
  search,
  startContent,
  endContent,
  userMenu,
  label,
  className,
  ...rest
}: AppHeaderProps): ReactElement {
  return (
    <View
      role="banner"
      {...rest}
      {...(label ? { accessibilityLabel: label } : {})}
      className={[
        "min-h-14 flex-row items-center gap-3 border-b border-separator bg-background px-4 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {textual(startContent)}
      {title == null ? null : <View className="shrink">{textual(title, "font-semibold")}</View>}
      <View className="min-w-0 flex-1 flex-row items-center">{textual(search)}</View>
      {endContent == null ? null : (
        <View className="flex-row items-center gap-1">{textual(endContent)}</View>
      )}
      {textual(userMenu)}
    </View>
  );
}
