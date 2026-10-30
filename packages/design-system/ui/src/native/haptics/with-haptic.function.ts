/**
 * Stackra file contract:
 * Purpose: `withHaptic(kind, handler)`: the handler that plays `kind` before calling the caller's, or `undefined` when
 *          there is no handler, so a control without one stays inert and silent.
 * Boundary: wraps one handler; the playing is `haptics`'.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3).
 */
import type { HapticKind } from "#native/haptics/haptic-kind.type";
import { haptics } from "#native/haptics/haptics";

/**
 * Wraps a handler so it plays feedback first.
 * @param kind - the feedback to play
 * @param handler - the caller's handler, or `undefined`
 * @returns the wrapped handler, or `undefined` without one
 */
export function withHaptic<TArgs extends unknown[]>(
  kind: HapticKind,
  handler: ((...args: TArgs) => void) | undefined,
): ((...args: TArgs) => void) | undefined {
  if (handler === undefined) return undefined;
  return (...args) => {
    haptics.play(kind);
    handler(...args);
  };
}
