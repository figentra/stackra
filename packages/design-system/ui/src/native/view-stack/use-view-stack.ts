/**
 * Stackra file contract:
 * Purpose: `useViewStack()`, the nearest native `ViewStack`'s state: the stack, the view on top, whether there is one to
 *          go back to, and `push` and `pop`.
 * Boundary: throws outside a `ViewStack`, which is a programming error.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3).
 */
import { use } from "react";

import type { ViewStackState } from "#contracts/types/view-stack-state.type";

import { ViewStackContext } from "./view-stack-context";

/**
 * The nearest view stack.
 * @returns its state and the calls that move it
 */
export function useViewStack(): ViewStackState {
  const value = use(ViewStackContext);
  if (!value) throw new Error("useViewStack() needs a ViewStack above it");
  return value.state;
}
