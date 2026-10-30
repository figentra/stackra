/**
 * Stackra file contract:
 * Purpose: `ItemCardGroupContext`, true inside a native ItemCardGroup so its cards (and SettingsCells) drop their frame.
 * Boundary: internal; a boolean context.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import { createContext } from "react";

/** True inside an ItemCardGroup. */
export const ItemCardGroupContext = createContext(false);
