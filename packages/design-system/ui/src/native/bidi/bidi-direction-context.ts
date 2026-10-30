/**
 * Stackra file contract:
 * Purpose: `BidiDirectionContext`, the direction a native `Bidi` block sets for its subtree, which `useDirection` reads
 *          before the app's.
 * Boundary: the context object only; `undefined` outside a block.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060.
 */
import { createContext } from "react";

import type { Direction } from "#contracts/enums/direction.enum";

/** The nearest native Bidi block's direction, or undefined outside one. */
export const BidiDirectionContext = createContext<Direction | undefined>(undefined);
