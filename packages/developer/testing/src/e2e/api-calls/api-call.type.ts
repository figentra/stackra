/**
 * Stackra file contract:
 * Purpose: `ApiCall`, one request the browser context sent and the server answered during the current test, as
 *          `apiCalls(key)` returns it.
 * Boundary: a type only. Header names are lower case, as Playwright reports them.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6).
 */

/** One answered request of the test. */
export interface ApiCall {
  /** The HTTP method, upper case. */
  readonly method: string;

  /** The full request URL. */
  readonly url: string;

  /** The request headers by lower-case name (`idempotency-key`). */
  readonly headers: Readonly<Record<string, string>>;
}
