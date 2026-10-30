/**
 * Stackra file contract:
 * Purpose: `useDashboardLayout`, a dashboard layout kept through a `DashboardLayoutPort`: it starts from the defaults,
 *          swaps in the saved layout once it loads (reconciled with today's tiles), and saves every change.
 * Boundary: a React hook shared by the web and native `DashboardGrid`; no DOM or native API. Without a port it is
 *           plain state. A load that fails keeps the defaults; a save that fails keeps the change on screen.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 16 and 18); ADR 0302 (decision 3); STA-1371.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import type { DashboardLayoutPort } from "#contracts/types/dashboard-layout-port.type";
import { reconcileDashboardLayout } from "#core/functions/reconcile-dashboard-layout.function";

/**
 * The layout and its setter, loaded from and saved to `port`.
 * @param port - where the layout lives; plain state without one
 * @param defaultLayout - every tile in its default order and size
 * @returns the current layout and the function that changes and saves it
 */
export function useDashboardLayout(
  port: DashboardLayoutPort | undefined,
  defaultLayout: DashboardLayout,
): readonly [DashboardLayout, (layout: DashboardLayout) => void] {
  const [layout, setLayout] = useState(defaultLayout);
  const defaults = useRef(defaultLayout);
  // Declared before the load, so a load always reconciles with this render's defaults.
  useEffect(() => {
    defaults.current = defaultLayout;
  });
  // Set once the reader changes the layout, so a slow load never overwrites their change.
  const isTouched = useRef(false);
  useEffect(() => {
    if (!port) return undefined;
    let isLive = true;
    port.load().then(
      (saved) => {
        if (isLive && saved && !isTouched.current)
          setLayout(reconcileDashboardLayout(saved, defaults.current));
      },
      // shortcut: a failed load keeps the defaults silently; surface it once a dashboard needs a "could not load" note.
      () => undefined,
    );
    return () => {
      isLive = false;
    };
  }, [port]);
  const change = useCallback(
    (next: DashboardLayout) => {
      isTouched.current = true;
      setLayout(next);
      // shortcut: a failed save is not reported; the layout stays on screen and the next change saves it again.
      port?.save(next).catch(() => undefined);
    },
    [port],
  );
  return [layout, change] as const;
}
