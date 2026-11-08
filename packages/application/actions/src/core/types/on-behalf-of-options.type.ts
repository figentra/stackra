/**
 * Stackra file contract:
 * Purpose: `OnBehalfOfOptions`, an action's `onBehalfOf` option: whether a service that calls it for a user may forward
 *          that user's access token once more, to the services the action itself calls (a second hop).
 * Boundary: a type only; `holdCallerToken` of `@stackra/app/server` reads it when the call is a service acting for a
 *           user. Absent, or `secondHop: false`, is one hop: the action's own outgoing calls carry the service token
 *           only, so the receiver runs them as the service alone. A user's own call (the first hop) forwards the user's
 *           token whatever this says.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, condition 5: one hop by default).
 */

/** How far a user's token travels through an action. */
export interface OnBehalfOfOptions {
  /** `true` lets a service calling this action for a user forward the user's token to the services it calls. */
  readonly secondHop: boolean;
}
