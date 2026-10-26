/**
 * Stackra file contract:
 * Purpose: the native `Drawer.Title`: HeroUI Native's bottom-sheet title, a heading-role `Text`; `level` is accepted
 *          and dropped (React Native has no heading level).
 * Boundary: reached as `Drawer.Title`; the barrel exports only its props type. It must sit inside the drawer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
import { BottomSheet } from "heroui-native";
import type { ReactElement } from "react";
import type { DrawerTitleProps } from "#native/drawer/drawer-title.props";

/** The drawer's title. `level` keeps the shared contract and is not used: the heading role carries no level. */
export function DrawerTitle({ level: _level, ...rest }: DrawerTitleProps): ReactElement {
  return <BottomSheet.Title {...rest} />;
}
