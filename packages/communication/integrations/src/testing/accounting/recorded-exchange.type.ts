/**
 * Stackra file contract:
 * Purpose: `RecordedExchange`, one call a provider driver makes and the provider's recorded answer: the method and
 *          path, the request parts a test pins (query, body, idempotency key) and either the parsed JSON answer or the
 *          refusal (`status`, `code`) the managed client raises for it.
 * Boundary: a type only. Recordings are built from the provider's public API documentation until a sandbox run
 *           replaces them (owner D3, 2026-10-27); a request part left out is not compared. No credential, token or
 *           real tenant data goes in a recording.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decision 8: the testing kit stays in Stackra).
 */

/**
 * One recorded call.
 *
 * @example
 * const miss: RecordedExchange = { method: "GET", path: "/journals", query: { reference: "k1" }, answer: { journals: [] } };
 */
export interface RecordedExchange {
  /** The HTTP method the driver must use. */
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  /** The literal path the driver must call, after the base URL. */
  readonly path: string;

  /** The query the driver must send, compared exactly when present. */
  readonly query?: Readonly<Record<string, string | number | boolean>>;

  /** The JSON body the driver must send, compared deeply when present. */
  readonly body?: unknown;

  /** The idempotency key the driver must pass the managed client, compared when present. */
  readonly idempotencyKey?: string;

  /** The provider's parsed JSON answer; ignored when `refusal` is set. */
  readonly answer?: unknown;

  /** The refusal the managed client raises for this call (`ProviderRefusedError`), instead of an answer. */
  readonly refusal?: { readonly status: number; readonly code?: string };
}
