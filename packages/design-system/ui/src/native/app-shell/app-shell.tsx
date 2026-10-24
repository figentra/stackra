/**
 * Stackra file contract:
 * Purpose: the native `AppShell`, an adapted form: on a phone the shell is the navigator (React Navigation's native
 *          tabs and stack are the frame), so this is the screen-level container for one that wants the console's
 *          vocabulary: the `header` above the page, the page below it filling the screen, and the `sidebar` in a
 *          bottom sheet that opens through `isOpen`, `defaultOpen` and `onOpenChange`. Choosing nothing closes it by the
 *          sheet's own dismissal: a press on the backdrop, a drag down or the Close button.
 * Boundary: built on the native Drawer of wave 4, which is HeroUI Native's inset bottom sheet (detached, the safe area
 *           plus 12 above the home bar, 16 either side, a 32 px radius; the owner decision of 2026-10-24), so the sheet
 *           style is not repeated here. There are no widths to switch on, so `collapseBelow` is accepted for the shared
 *           call site and ignored: the sidebar is always in the sheet, and a `sidebar` function is always told
 *           `isInDrawer: true`. There is no `main` landmark on native, so the page is a plain `View`. Extra props pass to
 *           the root `View`. A string or number child is drawn inside `Text`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0312; ADR 0314 (decisions 1, 4, 6, 7
 *          and 8); WCAG 2.2 SC 1.3.1 and 2.1.2.
 */
import { useState, type ReactElement, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import type { AppShellContractProps } from "#contracts/types/app-shell-contract-props.type";
import { Drawer } from "#native/drawer/drawer";
import { Text } from "#native/text/text";

// shortcut: English until @stackra/i18n ships; then the keys `ui::app-shell.navigation` and `ui::app-shell.close`.
const STRINGS = { navigation: "Navigation menu", close: "Close" } as const;

/**
 * Props of the native AppShell: the shared contract plus the root `View`'s own props, passed through.
 */
export type AppShellProps = AppShellContractProps & Omit<ViewProps, keyof AppShellContractProps>;

/** A node as the container can draw it: a string or number goes inside `Text`, any other node as it is. */
function textual(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;
}

/**
 * The frame of a screen: header, page and a sheet for the sidebar. Put a `Sidebar` in `sidebar`, an `AppHeader` or
 * `NavigationHeader` in `header` and the screen's content in `children`.
 */
export function AppShell({
  children,
  sidebar,
  header,
  collapseBelow: _collapseBelow,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  className,
  ...rest
}: AppShellProps): ReactElement {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = isOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  return (
    <View {...rest} className={["flex-1 bg-background", className].filter(Boolean).join(" ")}>
      {textual(header)}
      <View className="flex-1">{textual(children)}</View>
      {sidebar === undefined ? null : (
        <Drawer isOpen={open} onOpenChange={setOpen} label={STRINGS.navigation}>
          <Drawer.Close label={STRINGS.close} />
          <Drawer.Body>
            {typeof sidebar === "function" ? sidebar({ isInDrawer: true }) : textual(sidebar)}
          </Drawer.Body>
        </Drawer>
      )}
    </View>
  );
}
