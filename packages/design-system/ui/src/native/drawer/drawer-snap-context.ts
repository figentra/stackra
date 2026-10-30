/**
 * Stackra file contract:
 * Purpose: `DrawerSnapContext`, the snap state of the nearest native bottom drawer with two or more snap points, or
 *          null for any other drawer.
 * Boundary: the context only; `Drawer` provides it around its sheet, `DrawerHandle` reads it.
 * Runtime: react-native
 * Governing contract: STA-1371 (drawer resize on native).
 */
import { createContext } from "react";

import type { DrawerSnap } from "#native/drawer/drawer-snap.type";

/** The sheet's snap state, or null. */
export const DrawerSnapContext = createContext<DrawerSnap | null>(null);
