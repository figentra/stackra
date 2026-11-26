/**
 * Stackra file contract:
 * Purpose: `LocalTool`, a tool the local MCP serves from a command's definition: its name, description, input JSON
 *          Schema, hints (read-only, destructive, idempotent), and `invoke`, which runs the command and resolves with
 *          its `--json` document.
 * Boundary: a type only, shaped like `@stackra/console`'s `ConsoleTool` (from `toolsOf`); the schema and handler are
 *           the command's own (ADR 0282 decision 5, as amended). A tool that leaves a hint out gets the MCP default.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-020 and FR-023; STA-2873.
 */

/** A command served as a local MCP tool. */
export interface LocalTool {
  /** The MCP tool name. */
  readonly name: string;

  /** What it does. */
  readonly description: string;

  /** The JSON Schema of its input. */
  readonly inputSchema: Readonly<Record<string, unknown>>;

  /** It changes nothing. */
  readonly readOnly: boolean;

  /** It may delete or overwrite what someone wrote; true when absent for a tool that writes (the MCP default). */
  readonly destructive?: boolean;

  /** Running it again with the same input changes nothing more; false when absent (the MCP default). */
  readonly idempotent?: boolean;

  /** Runs it with `input`; resolves with the command's `--json` document and exit code. */
  readonly invoke: (input: unknown) => Promise<{
    readonly document: Readonly<Record<string, unknown>>;
    readonly exitCode: number;
  }>;
}
