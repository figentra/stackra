/**
 * Stackra file contract:
 * Purpose: `UseBreakpointReturns`, what the native `useBreakpoint` returns, for the generated API docs.
 * Boundary: types only; the hook in `use-breakpoint.ts` returns `BreakpointState` itself.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { BreakpointState } from "#contracts/types/breakpoint-state.type";

/** The value `useBreakpoint()` returns: the window's breakpoint and size class. */
export type UseBreakpointReturns = BreakpointState;
