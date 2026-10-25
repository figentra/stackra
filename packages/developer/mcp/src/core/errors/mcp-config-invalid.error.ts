/**
 * Stackra file contract:
 * Purpose: `McpConfigInvalidError`, thrown when a `.mcp.yaml` cannot be read or breaks its shape or rules: names the
 *          source and every issue.
 * Boundary: a plain `Error`, not a refusal: a bad `.mcp.yaml` is a developer's mistake found by `stackra mcp sync`
 *           before any server starts. The file holds secret names only, so the issues may quote it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (enforcement); ADR 0173.
 */
import type { McpIssue } from "#core/types/mcp-issue.type";

/**
 * A `.mcp.yaml` that cannot be used.
 *
 * @example
 * try {
 *   parseMcpConfig(document, ".mcp.yaml");
 * } catch (error) {
 *   if (error instanceof McpConfigInvalidError) error.issues; // [{ path: "mcpServers.x", code: "…", message: "…" }]
 * }
 */
export class McpConfigInvalidError extends Error {
  /** The file path, or a description of where the document came from. */
  readonly source: string;

  /** Every issue, in document order. */
  readonly issues: readonly McpIssue[];

  /**
   * @param source - the file path or a description of the document.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly McpIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path || "(document)"}: ${issue.message}`).join("; ")}`,
    );
    this.name = "McpConfigInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
