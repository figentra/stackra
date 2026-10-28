/**
 * Stackra file contract:
 * Purpose: `BlockEventHandlers`, what a host gives a renderer to act on the verbs its blocks raise: `onNavigate` for a
 *          navigate verb, `onAction` for an action verb.
 * Boundary: a type only, in the leaf entry. Both are optional: a verb with no handler is dropped, so a host that
 *           offers no actions shows a block whose action does nothing rather than one that throws. Written as methods,
 *           so a host may pass a handler typed by its own route keys (`(key: RouteKey) => void`).
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 3); ADR 0112.
 */
import type { BlockEvent } from "#contracts/types/block-event.type";

/**
 * The host's handlers of block verbs.
 *
 * @example
 * <DocumentRenderer document={doc} onNavigate={(key: RouteKey) => navigate.to(Routes[key])} />
 */
export interface BlockEventHandlers {
  /** Opens the route a navigate verb names, by its generated key. */
  onNavigate?: (route: string) => void;

  /** Runs the action an action verb names; the host dispatches it through its client. */
  onAction?: (event: Extract<BlockEvent, { readonly verb: "action" }>) => void;
}
