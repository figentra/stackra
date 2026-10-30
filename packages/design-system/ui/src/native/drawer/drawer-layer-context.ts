/**
 * Stackra file contract:
 * Purpose: `DrawerLayerContext`, the nearest native drawer, or null outside any.
 * Boundary: the context only; `Drawer` provides it, its parts and a drawer opened from it read it.
 * Runtime: react-native
 * Governing contract: owner request 2026-10-29 (STA-1371, stacked drawers).
 */
import { createContext } from "react";

import type { DrawerLayer } from "#native/drawer/drawer-layer.type";

/** The drawer the reader sits in, or null outside any. */
export const DrawerLayerContext = createContext<DrawerLayer | null>(null);
