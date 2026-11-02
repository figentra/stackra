/**
 * Stackra file contract:
 * Purpose: `ToolPorts`, what a local MCP tool run may touch beyond the streams it captures: the working directory, and
 *          optionally the environment, the process runner, the completions and the width.
 * Boundary: a type only; never a terminal or a prompter (a tool run is not interactive).
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-020 and FR-029.
 */
import type { ConsolePorts } from "#core/types/console-ports.type";

/** The ports of a tool run. */
export type ToolPorts = Pick<ConsolePorts, "cwd"> &
  Partial<Pick<ConsolePorts, "env" | "process" | "completions" | "columns">>;
