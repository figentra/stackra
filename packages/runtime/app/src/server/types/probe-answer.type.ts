/**
 * Stackra file contract:
 * Purpose: `ProbeAnswer`, what `ServerApp.probe` resolves to for a health route: the HTTP status and the JSON body the
 *          generated adapter writes.
 * Boundary: a type only. The body is a status per name and nothing more; an indicator's detail is never copied in.
 * Runtime: node
 * Governing contract: registry gap R-27 (owner decision 23); ADR 0184 (no detail leaked in operational output).
 */

/** The answer to `GET /healthz` or `GET /readyz`. */
export interface ProbeAnswer {
  /** 200, or 503 when the app drains or an indicator is down. */
  readonly status: 200 | 503;

  /** `{ status }` for liveness; the status of each indicator by name for readiness. */
  readonly body: Readonly<Record<string, string>>;
}
