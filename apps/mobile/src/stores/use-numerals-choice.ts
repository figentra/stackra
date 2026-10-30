/**
 * Stackra file contract:
 * Purpose: `useNumeralsChoice`, the showcase's digits, re-rendering when Display or Settings switches them.
 * Boundary: a React hook over `numeralsChoice`.
 * Runtime: react-native
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28).
 */
import { useSyncExternalStore } from "react";

import { numeralsChoice } from "./numerals-choice.store";

/** The digits on screen. */
export function useNumeralsChoice() {
  return useSyncExternalStore(numeralsChoice.subscribe, numeralsChoice.getSnapshot);
}
