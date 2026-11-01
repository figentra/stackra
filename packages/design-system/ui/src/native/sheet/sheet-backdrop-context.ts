/**
 * Stackra file contract:
 * Purpose: `SheetBackdropContext`, the backdrop look a native `Sheet` asks of the `Drawer` it draws with: `blur` is
 *          HeroUI Native's blur overlay, `transparent` a clear one, `opaque` (and no Sheet) the dim scrim.
 * Boundary: internal to `native/sheet` and `native/drawer`; read by the drawer root outside its portal.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12); STA-1371.
 */
import { createContext } from "react";

import type { SheetBackdrop } from "#contracts/enums/sheet-backdrop.enum";

/** The backdrop of the Sheet around a Drawer, or null for a plain Drawer. */
export const SheetBackdropContext = createContext<SheetBackdrop | null>(null);
