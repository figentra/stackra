/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Description`: a short muted line under the title, inside `Drawer.Header`.
 * Boundary: text only; the title still names the dialog.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371).
 */
import type { ReactElement } from "react";

import type { DrawerDescriptionProps } from "#react/drawer/drawer-description.props";

/** A line that says what the drawer is for. */
export function DrawerDescription({ className, ...rest }: DrawerDescriptionProps): ReactElement {
  return (
    <p
      data-slot="drawer-description"
      className={["text-sm text-muted", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
