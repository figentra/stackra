/**
 * Stackra file contract:
 * Purpose: `ContextsProps`, the props of `Contexts`: what every context gets, plus an optional subset of keys for a
 *          page that mounts only some contexts (a prerendered offline page).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10).
 */
import type { ContextProps } from "#react/contexts/context-props.type";

/** The props of `Contexts`. */
export interface ContextsProps extends ContextProps {
  /** The context keys to mount, outermost first, in place of the wiring's; each must be registered. */
  readonly contexts?: readonly string[];
}
