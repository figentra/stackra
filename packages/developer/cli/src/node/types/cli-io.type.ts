/**
 * Stackra file contract:
 * Purpose: `CliIo`, where a command writes: its normal output, its errors, and whether a tool it starts may take over
 *          this process's terminal.
 * Boundary: type only. The binary passes `PROCESS_IO`; the local MCP passes `captureIo`, so a command run for an
 *           assistant never touches standard output, which carries the MCP protocol.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 5: the MCP runs the CLI's own commands).
 */

/** The output streams of one command run. */
export type CliIo = {
  /** Writes normal output. */
  readonly out: (text: string) => void;

  /** Writes errors and diagnostics. */
  readonly err: (text: string) => void;

  /** True when a started tool inherits this process's stdio (a terminal); false when its output is piped here. */
  readonly inherit: boolean;
};
