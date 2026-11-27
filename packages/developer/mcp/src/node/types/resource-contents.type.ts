/**
 * Stackra file contract:
 * Purpose: `ResourceContents`, the text contents of one resource as `resources/read` answers it and as a prompt
 *          embeds it: its URI, MIME type and text.
 * Boundary: type only; the local resources are all text, never a blob.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); the MCP `TextResourceContents` shape; STA-2919.
 */

/** The text of one resource. */
export type ResourceContents = {
  /** The resource's `stackra://` URI. */
  readonly uri: string;
  /** `text/markdown` or `application/json`. */
  readonly mimeType: string;
  /** The whole text. */
  readonly text: string;
};
