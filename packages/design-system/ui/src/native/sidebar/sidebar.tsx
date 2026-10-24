/**
 * Stackra file contract:
 * Purpose: the native `Sidebar`, an adapted form: an inset navigation list. A phone has no side column, so it stacks
 *          `startContent`, the `NavigationList` of the contract's `items` and `endContent` in a
 *          column, for the sheet AppShell opens, a settings screen or an iPad split view.
 * Boundary: built on the native NavigationList of this wave, which is the same group and so not a sibling in the sense of
 *           ADR 0314 decision 4. There is no icon rail on a phone, so `isCollapsed`, `defaultCollapsed` and
 *           `onCollapsedChange` are accepted for the shared call site and never read or called; the page says so. A
 *           string or number slot is drawn inside `Text`, because React Native refuses a bare string outside one. Extra
 *           props pass to the root `View`; `label` names the navigation.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4 and 7); WCAG
 *          2.2 SC 1.3.1 and 4.1.2.
 */
import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";
import { NavigationList } from "#native/navigation-list/navigation-list";
import { Text } from "#native/text/text";

/**
 * Props of the native Sidebar: the shared contract plus the root `View`'s own props, passed through. The sidebar's
 * content is `items` and its two slots, so the type refuses JSX children.
 */
export type SidebarProps = SidebarContractProps &
  Omit<ViewProps, keyof SidebarContractProps | "children">;

/** A slot as the column can draw it: a string or number goes inside `Text`, any other node as it is. */
function slotNode(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;
}

/** A column of navigation, with the app's nodes above and below it. */
export function Sidebar({
  items,
  label,
  startContent,
  endContent,
  isCollapsed: _isCollapsed,
  defaultCollapsed: _defaultCollapsed,
  onCollapsedChange: _onCollapsedChange,
  className,
  ...rest
}: SidebarProps): ReactElement {
  return (
    <View {...rest} className={["gap-2 p-2", className].filter(Boolean).join(" ")}>
      {slotNode(startContent)}
      <NavigationList items={items} {...(label === undefined ? {} : { label })} />
      {slotNode(endContent)}
    </View>
  );
}
