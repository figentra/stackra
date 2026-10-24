/**
 * Stackra file contract:
 * Purpose: the web `RouteOverlay`: a `Modal` or a `Drawer` whose open state is a route. Put it as the element of a
 *          child route and the parent's `Outlet` mounts it when the URL matches, so it is open exactly while the
 *          route is; closing (the close button, Escape, a press outside, `useRouteOverlay().close()`) navigates away
 *          and the overlay unmounts. `presentation` picks the form: `modal`, `full-screen` (a modal at `size="full"`),
 *          `sheet` (a drawer on the bottom edge) or `drawer` (the reading-end edge, a bottom sheet below 768 px).
 * Boundary: thin glue over `@stackra/ui`'s Modal and Drawer, which own focus trapping, hiding the page behind the
 *           overlay and returning focus to the opener (the parent stays mounted, so the opener still exists); this
 *           file owns only the route. Closing is not animated: the route unmounts at once, because an exit delay
 *           would leave the overlay hidden but mounted when a `useBlocker` refuses the leave. The overlay is always
 *           controlled open, so a refused leave keeps it open. The close button stays even when `isDismissable` is
 *           false, so there is never a keyboard trap. Needs React Router's data router (`createBrowserRouter`).
 * Runtime: browser
 * Governing contract: ADR 0317 (decisions 2, 6 and 9); ADR 0312; ADR 0165 (React Router 7, no Next.js); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import * as Ui from "@stackra/ui/react";
import { useMemo, useState, type ReactElement } from "react";

import type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";
import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import { RouteOverlayContext } from "#react/route-overlay/route-overlay-context";
import { useNarrowScreen } from "#react/route-overlay/use-narrow-screen";
import { useRouteClose } from "#react/route-overlay/use-route-close";

/** Props of the web RouteOverlay: the shared contract, which has no element of its own to pass props to. */
export type RouteOverlayProps = RouteOverlayContractProps;

/**
 * A route drawn as a modal, sheet, drawer or full-screen page. Render it as the element of a child route; the open
 * state is the route, so the overlay needs no `isOpen`.
 */
export function RouteOverlay({
  children,
  title,
  closeLabel,
  presentation = "modal",
  isDismissable: startsDismissable = true,
  footer,
  size,
}: RouteOverlayProps): ReactElement {
  // `isDismissable` is the starting value: a page changes it later through `useRouteOverlay().setDismissable`.
  const [isDismissable, setDismissable] = useState(startsDismissable);
  const { close, complete } = useRouteClose();
  const isNarrow = useNarrowScreen();

  const controls = useMemo<RouteOverlayControls>(
    () => ({ close, complete, setDismissable, isDismissable }),
    [close, complete, isDismissable],
  );
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) close();
  };
  const dismissal = { isDismissable, isKeyboardDismissDisabled: !isDismissable } as const;

  const isPanel = presentation === "sheet" || presentation === "drawer";
  const edge = presentation === "sheet" || isNarrow ? "bottom" : "end";

  return (
    <RouteOverlayContext value={controls}>
      {isPanel ? (
        <Ui.Drawer isOpen onOpenChange={onOpenChange} placement={edge} {...dismissal}>
          <Ui.Drawer.Close label={closeLabel} />
          <Ui.Drawer.Header>
            <Ui.Drawer.Title>{title}</Ui.Drawer.Title>
          </Ui.Drawer.Header>
          <Ui.Drawer.Body>{children}</Ui.Drawer.Body>
          {footer ? <Ui.Drawer.Footer>{footer}</Ui.Drawer.Footer> : null}
        </Ui.Drawer>
      ) : (
        <Ui.Modal
          isOpen
          onOpenChange={onOpenChange}
          size={presentation === "full-screen" ? "full" : size}
          {...dismissal}
        >
          <Ui.Modal.Close label={closeLabel} />
          <Ui.Modal.Header>
            <Ui.Modal.Title>{title}</Ui.Modal.Title>
          </Ui.Modal.Header>
          <Ui.Modal.Body>{children}</Ui.Modal.Body>
          {footer ? <Ui.Modal.Footer>{footer}</Ui.Modal.Footer> : null}
        </Ui.Modal>
      )}
    </RouteOverlayContext>
  );
}
