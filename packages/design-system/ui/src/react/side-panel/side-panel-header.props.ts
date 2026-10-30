/**
 * Stackra file contract:
 * Purpose: `SidePanelHeaderProps`, the props of `SidePanel.Header` in `side-panel-header.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { ComponentPropsWithRef, ReactNode } from "react";

/** Props of SidePanel.Header: a `div`'s props plus its slots and built-in buttons. */
export type SidePanelHeaderProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** The start of the row: a title, or a menu of recent items. */
  readonly children?: ReactNode;
  /** The panel's own actions, drawn before the built-in buttons at the end of the row. */
  readonly actions?: ReactNode;
  /** True, the default, to draw the expand button (hidden while the panel is a drawer). */
  readonly isExpandable?: boolean | undefined;
  /** True, the default, to draw the close button. */
  readonly isClosable?: boolean | undefined;
};
