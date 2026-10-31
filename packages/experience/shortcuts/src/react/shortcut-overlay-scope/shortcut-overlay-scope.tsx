/**
 * Stackra file contract:
 * Purpose: `ShortcutOverlayScope`, an overlay's shortcut scope: while mounted it is the topmost overlay, so page shortcuts
 *          pause and the actions registered inside it (Mod+Enter confirm) answer instead. A modal, drawer, sheet or
 *          popover wraps its open content in it.
 * Boundary: renders its children only. App-scope actions keep listening under it.
 * Runtime: browser
 * Governing contract: ADR 0508 (scopes: page shortcuts paused under overlays).
 */
import { type ReactElement, type ReactNode, use, useEffect, useState } from "react";

import { ShortcutOverlayContext } from "#react/shortcut-provider/shortcut-overlay-context";
import { ShortcutRegistryContext } from "#react/shortcut-provider/shortcut-registry-context";

/** Ids of overlay scopes, unique per page. */
let nextOverlay = 1;

/**
 * Makes its content the topmost overlay while mounted.
 *
 * @example
 * <Modal.Body><ShortcutOverlayScope>{content}</ShortcutOverlayScope></Modal.Body>
 */
export function ShortcutOverlayScope({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const { registry } = use(ShortcutRegistryContext);
  const [id] = useState(() => nextOverlay++);
  useEffect(() => registry.pushOverlay(id), [registry, id]);
  return <ShortcutOverlayContext value={id}>{children}</ShortcutOverlayContext>;
}
