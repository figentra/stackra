/**
 * Stackra file contract:
 * Purpose: `ConsoleTool`, a command offered as a local developer MCP tool: its MCP name, description, input JSON
 *          Schema and read-only hint, and `invoke`, which runs the command through the same kernel with `--json` and
 *          resolves with that run's JSON document, exit code and plain text.
 * Boundary: a type only; `toolsOf` builds them, `@stackra/mcp` serves them. Never a tenant MCP tool (ADR 0155).
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-020 and FR-027; ADR 0282 decision 5.
 */

/** A command as a local MCP tool. */
export interface ConsoleTool {
  /** The MCP tool name: the command's name with `:` as `_` (`mcp:sync` is `mcp_sync`). */
  readonly name: string;

  /** The command's description. */
  readonly description: string;

  /** The JSON Schema of its input, derived from its fields. */
  readonly inputSchema: Readonly<Record<string, unknown>>;

  /** It changes nothing. */
  readonly readOnly: boolean;

  /** Runs the command with `input` and resolves with its `--json` document. */
  readonly invoke: (input: unknown) => Promise<{
    /** The run's `{ ok, data }` or `{ ok: false, error }` document. */
    readonly document: Readonly<Record<string, unknown>>;
    /** The run's exit code. */
    readonly exitCode: number;
  }>;
}
