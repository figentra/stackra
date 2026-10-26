/**
 * Stackra file contract:
 * Purpose: `RouterArgs`, the arguments React Router gives a loader or an action: the request, the params and the
 *          request context.
 * Boundary: a type only; internal to `./react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (web runtime); ADR 0260 (decision 4).
 */

/** The arguments React Router gives a loader or an action. */
export interface RouterArgs {
  /** The incoming request. */
  readonly request: Request;
  /** The matched route's path params. */
  readonly params: Readonly<Record<string, string | undefined>>;
  /** The request context the server adapter passes, read through the route keys. */
  readonly context?: unknown;
}
