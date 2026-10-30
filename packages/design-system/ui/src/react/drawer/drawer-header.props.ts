/**
 * Stackra file contract:
 * Purpose: `DrawerHeaderProps`, the props of the web `Drawer.Header` in `drawer-header.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3).
 */
import type { DrawerHeaderProps as HeroDrawerHeaderProps } from "@heroui/react";

import type { CloseControl } from "#contracts/types/close-control.type";

/** Props of the web Drawer.Header: HeroUI v3's own header props, plus how its close control is drawn. */
export type DrawerHeaderProps = HeroDrawerHeaderProps & {
  /** The `closeButton` of the header's `Drawer.Close` when it sets none; `"esc"` by default. */
  readonly closeButton?: CloseControl | undefined;
};
