/**
 * Stackra file contract:
 * Purpose: `DrawerLayerContext`, the nearest open web drawer, or null on the page.
 * Boundary: the context only; `Drawer` provides it inside its dialog, `Drawer.Header` and a drawer opened from it read
 *           it.
 * Runtime: browser
 * Governing contract: owner request 2026-10-29 (STA-1371, stacked drawers).
 */
import { createContext } from "react";

import type { DrawerLayer } from "#react/drawer/drawer-layer.type";

/** The drawer the reader sits in, or null outside any. */
export const DrawerLayerContext = createContext<DrawerLayer | null>(null);
