/**
 * Stackra file contract:
 * Purpose: `useHaptics`, the earlier name of `useHaptic()`, kept while the apps still call it.
 * Boundary: an alias only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3).
 */
import { useHaptic } from "#native/haptics/use-haptic";

/**
 * The earlier name of `useHaptic()`.
 * @deprecated Use `useHaptic()`; this alias goes once the apps call it.
 */
export const useHaptics = useHaptic;
