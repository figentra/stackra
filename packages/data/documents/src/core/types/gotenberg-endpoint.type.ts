/**
 * Stackra file contract:
 * Purpose: `GotenbergEndpoint`, where the `gotenberg` drivers reach the engine: its base URL, the time a call may take
 *          and the headers it needs (basic auth, a trace id).
 * Boundary: a type only. The values are the deployment's: a Connection or the host's config fills them (ADR 0356);
 *           nothing here has a default.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0356 (Connections).
 */

/** How to reach a Gotenberg engine. */
export interface GotenbergEndpoint {
  /** The engine's base URL (`http://gotenberg:3000`). */
  readonly url: string;

  /** The longest a call may take before it is abandoned. */
  readonly timeoutMs: number;

  /** Headers sent with every call (`authorization`). */
  readonly headers?: Readonly<Record<string, string>>;
}
