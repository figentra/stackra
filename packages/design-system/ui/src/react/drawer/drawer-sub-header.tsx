/**
 * Stackra file contract:
 * Purpose: the web `Drawer.SubHeader`: a band under the header, ruled off from the body, for a SegmentedControl, Tabs,
 *          a step rail or a Stepper. It sits outside the body, so it stays put while the body scrolls.
 * Boundary: layout only; the control inside is the caller's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371).
 */
import type { ReactElement } from "react";

import type { DrawerSubHeaderProps } from "#react/drawer/drawer-sub-header.props";

/** The band under the header. */
export function DrawerSubHeader({ className, ...rest }: DrawerSubHeaderProps): ReactElement {
  return (
    <div
      data-slot="drawer-sub-header"
      className={["shrink-0 border-b border-separator px-6 py-3", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
