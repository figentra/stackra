/**
 * Stackra file contract:
 * Purpose: `LocalResource`, one entry of the local MCP's `resources/list`: its `stackra://` URI, name, title,
 *          description and MIME type, as the MCP `Resource` shape has them.
 * Boundary: type only; `listLocalResources` builds it.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); the MCP `resources/list` result; STA-2919.
 */

/** A resource the local MCP lists. */
export type LocalResource = {
  /** Its `stackra://` URI, which `resources/read` takes. */
  readonly uri: string;
  /** A short programmatic name, such as `skills/backend-errors`. */
  readonly name: string;
  /** The name a person reads. */
  readonly title: string;
  /** What it holds and when to read it. */
  readonly description: string;
  /** `text/markdown` or `application/json`. */
  readonly mimeType: string;
};
