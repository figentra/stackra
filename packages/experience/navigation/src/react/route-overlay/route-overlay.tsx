/**
 * Stackra file contract:
 * Purpose: the web `RouteOverlay`: a `Modal` or a `Drawer` whose open state is a route. Put it as the element of a
 *          child route and the parent's `Outlet` mounts it when the URL matches, so it is open exactly while the
 *          route is; closing (the close button, Escape, a press outside, `useRouteOverlay().close()`) navigates away
 *          and the overlay unmounts. `presentation` picks the form: `modal`, `full-screen` (a modal at `size="full"`),
 *          `sheet` (a drawer on the bottom edge) or `drawer` (the reading-end edge, a bottom sheet below 768 px).
 * Boundary: thin glue over `@stackra/ui`'s Modal and Drawer, which own focus trapping, hiding the page behind the
 *           overlay and returning focus to the opener (the parent stays mounted, so the opener still exists), and it
 *           gives focus back itself after an Escape, which unmounts the dialog before React Aria can; this
 *           file owns only the route. Closing is not animated: the route unmounts at once, because an exit delay
 *           would leave the overlay hidden but mounted when a `useBlocker` refuses the leave. The overlay is always
 *           controlled open, so a refused leave keeps it open. The close button stays even when `isDismissable` is
 *           false, so there is never a keyboard trap. Needs React Router's data router (`createBrowserRouter`).
 *           Stacking: a route overlay rendered in another's page (a child route of the overlay's route) is a layer
 *           over it. A stacked drawer or sheet shows the Drawer's back button (closing just that
 *           layer) and a breadcrumb of the layers under it; a crumb navigates to that
 *           layer's route, which unmounts every layer above it. The stack is meant to stop at
 *           `ROUTE_OVERLAY_MAX_DEPTH` (3); a deeper layer still opens, with a development warning, because the URL
 *           is the truth. Escape and a press outside close the top layer only (React Aria's nested modals).
 * Runtime: browser
 * Governing contract: ADR 0317 (decisions 2, 6 and 9); ADR 0312; ADR 0165 (React Router 7, no Next.js); ADR 0060
 *          (right-to-left); ADR 0317 amendment 2026-10-28 (stacked overlays); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import { Breadcrumbs, Drawer, Modal } from "@stackra/ui/react";
import { useContext, useEffect, useMemo, useState, type ReactElement } from "react";
import { useLocation, useNavigate, useResolvedPath } from "react-router";

import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import { RouteOverlayContext } from "#react/route-overlay/route-overlay-context";
import { ROUTE_OVERLAY_MAX_DEPTH } from "#react/route-overlay/route-overlay-max-depth.constant";
import { RouteOverlayStackContext } from "#react/route-overlay/route-overlay-stack-context";
import type { RouteOverlayProps } from "#react/route-overlay/route-overlay.props";
import { useNarrowScreen } from "#react/route-overlay/use-narrow-screen";
import { useRouteClose } from "#react/route-overlay/use-route-close";

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
  trailLabel,
}: RouteOverlayProps): ReactElement {
  // `isDismissable` is the starting value: a page changes it later through `useRouteOverlay().setDismissable`.
  const [isDismissable, setDismissable] = useState(startsDismissable);
  // The element that had focus as the route opened, read once at the first render, before the dialog takes focus.
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );
  useEffect(
    () => () => {
      // React Aria gives focus back when its dialog closes, but Escape closes the route mid key press and the dialog
      // unmounts before React Aria can, leaving focus on the body; the overlay gives it back to the opener then.
      requestAnimationFrame(() => {
        const isLost = document.activeElement === null || document.activeElement === document.body;
        if (isLost && opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    },
    [opener],
  );
  const { close, complete } = useRouteClose();
  const isNarrow = useNarrowScreen();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { pathname } = useResolvedPath(".");
  const under = useContext(RouteOverlayStackContext);
  const label = trailLabel ?? (typeof title === "string" ? title : "");
  const layers = useMemo(() => [...under, { label, path: pathname }], [under, label, pathname]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && layers.length > ROUTE_OVERLAY_MAX_DEPTH)
      // oxlint-disable-next-line no-console -- reason: a dev-only depth warning; navigation has no logger dependency
      console.warn(
        `RouteOverlay: ${layers.length} overlays are stacked; the design stops at ${ROUTE_OVERLAY_MAX_DEPTH}.`,
      );
  }, [layers.length]);

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
      <RouteOverlayStackContext value={layers}>
        {isPanel ? (
          <Drawer
            isOpen
            onOpenChange={onOpenChange}
            placement={edge}
            data-stack-depth={layers.length}
            {...dismissal}
          >
            <Drawer.Header>
              {under.length > 0 ? (
                <Breadcrumbs
                  items={[
                    ...under.map((layer) => ({
                      id: layer.path,
                      label: layer.label,
                      onPress: () =>
                        void navigate({ pathname: layer.path, search }, { replace: true }),
                    })),
                    { id: pathname, label },
                  ]}
                />
              ) : null}
              <Drawer.Title>{title}</Drawer.Title>
              <Drawer.Close label={closeLabel} />
            </Drawer.Header>
            <Drawer.Body>{children}</Drawer.Body>
            {footer ? <Drawer.Footer>{footer}</Drawer.Footer> : null}
          </Drawer>
        ) : (
          <Modal
            isOpen
            onOpenChange={onOpenChange}
            size={presentation === "full-screen" ? "full" : size}
            {...dismissal}
          >
            <Modal.Close label={closeLabel} />
            <Modal.Header>
              <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
          </Modal>
        )}
      </RouteOverlayStackContext>
    </RouteOverlayContext>
  );
}
