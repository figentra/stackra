/**
 * Stackra file contract:
 * Purpose: `RawResponse`, the provider's answer to `IntegrationApi.send` as it came: its status, its headers and its
 *          body as text, for every status.
 * Boundary: a type only. The caller reads the body; the client never puts it in an error or a log.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); STA-2607.
 */

/**
 * An answer, unparsed.
 *
 * @example
 * if (answer.status === 409) return conflictOf(answer.body);
 */
export interface RawResponse {
  /** The HTTP status code. */
  readonly status: number;

  /** The response headers, by lower-case name. */
  readonly headers: Readonly<Record<string, string>>;

  /** The body as text; empty when there was none. */
  readonly body: string;
}
