/**
 * Stackra file contract:
 * Purpose: `BlurTargetContext`: the view Android's blur samples (expo-blur's `BlurTargetView`, placed by
 *          `MaterialBackdrop`), or null where no backdrop was placed.
 * Boundary: a context only; iOS blurs whatever is behind it and never reads this.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 7 as amended 2026-10-31).
 */
import { createContext, type RefObject } from "react";
import type { View } from "react-native";

/** The view Android's blur samples, or null. */
export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);
