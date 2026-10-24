/**
 * Stackra file contract:
 * Purpose: `McpIssue`, one reason a `.mcp.yaml` is invalid: the dotted path, a snake_case code and a message.
 * Boundary: type only; `McpConfigInvalidError` carries a list of them. A message names secrets, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (enforcement); ADR 0231 (machine codes are snake_case).
 */

/** One invalid value of a `.mcp.yaml`. */
export type McpIssue = {
  /** Dotted path inside the document (`mcpServers.context7.args`); empty for the whole document. */
  readonly path: string;
  /** A snake_case code: a zod issue code, or `secret_without_exec`, `secret_in_remote_server`, `unpinned_npx_server`. */
  readonly code: string;
  /** What is wrong and how to fix it. */
  readonly message: string;
};
