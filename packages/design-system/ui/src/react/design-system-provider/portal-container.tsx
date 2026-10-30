/**
 * Stackra file contract:
 * Purpose: `PortalContainer`, the element every web overlay under it portals into: a scoped preview (a brand or
 *          direction frame) passes its own element, so a Drawer, Modal, AlertDialog or Popover, and HeroUI's own
 *          Select, ComboBox, Dropdown, Tooltip and DatePicker popovers, keep that scope's theme variables,
 *          `data-brand`, `dir` and `lang`, which `document.body` would not have.
 * Boundary: React Aria's portal provider, which every React Aria overlay reads; with no element, overlays portal to
 *           `document.body` as HeroUI does.
 * Runtime: browser
 * Governing contract: STA-1371 (Stackra section frames, 2026-10-29; react-aria approved by the owner 2026-10-29);
 *          ADR 0340 (decision 2: brand layers).
 */
import type { ReactElement, ReactNode } from "react";
import { UNSAFE_PortalProvider } from "react-aria";

/** Overlays opened under `children` portal into `container`. */
export function PortalContainer({
  container,
  children,
}: {
  /** The element overlays portal into; none leaves them on `document.body`. */
  readonly container: HTMLElement | null | undefined;
  readonly children: ReactNode;
}): ReactElement {
  // No element: no provider, since React Aria draws no overlay at all when its container comes back null.
  return container ? (
    <UNSAFE_PortalProvider getContainer={() => container}>{children}</UNSAFE_PortalProvider>
  ) : (
    <>{children}</>
  );
}
