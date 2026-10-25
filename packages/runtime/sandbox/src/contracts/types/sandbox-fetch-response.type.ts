/**
 * Stackra file contract:
 * Purpose: `SandboxFetchResponse`, what the `SandboxFetchProxy` answers a code step's request with; the code receives it
 *          as the plain object its `fetch` resolves to.
 * Boundary: a type only, plain JSON data written into the sandbox. The body is text: the code parses JSON itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decisions 5 and 7).
 */

/**
 * A response to a code step.
 *
 * @example
 * const response: SandboxFetchResponse = { status: 200, headers: { "content-type": "application/json" }, body: "{}" };
 */
export interface SandboxFetchResponse {
  /** The HTTP status. */
  readonly status: number;

  /** The response headers, by lower-case name. */
  readonly headers: Readonly<Record<string, string>>;

  /** The body as text. */
  readonly body: string;
}
