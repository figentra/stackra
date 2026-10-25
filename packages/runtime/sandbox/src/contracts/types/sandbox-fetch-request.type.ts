/**
 * Stackra file contract:
 * Purpose: `SandboxFetchRequest`, one HTTP request a code step's `fetch(url, init)` asks the `SandboxFetchProxy` to
 *          send: its URL, method, headers and text body.
 * Boundary: a type only, plain JSON data read out of the sandbox. Its URL's origin is on the run's allow-list before
 *           the proxy sees it.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decisions 5 and 7).
 */

/**
 * A request from a code step.
 *
 * @example
 * const request: SandboxFetchRequest = { url: "https://api.example.com/rates", method: "GET", headers: {} };
 */
export interface SandboxFetchRequest {
  /** The absolute URL, whose origin is allow-listed for the run. */
  readonly url: string;

  /** The method, upper case (`GET` when the code named none). */
  readonly method: string;

  /** The headers the code set, by name. */
  readonly headers: Readonly<Record<string, string>>;

  /** The text body, when the code sent one. */
  readonly body?: string;
}
