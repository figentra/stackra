/**
 * Stackra file contract:
 * Purpose: `RouteReloadContext`, the reload of the screen `toScreen` renders, read by `useRouteReload`.
 * Boundary: internal; `null` outside a screen.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16).
 */
import { createContext } from "react";

import type { RouteReload } from "#native/route-reload/route-reload.type";

/** The current screen's reload. */
export const RouteReloadContext = createContext<RouteReload | null>(null);
