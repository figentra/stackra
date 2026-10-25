/**
 * Stackra file contract:
 * Purpose: `StackraRunner`, how the local MCP runs a `stackra` command (`["gen", "--check"]`), so every write goes
 *          through the CLI's own commands and gates. `@stackra/cli` passes its in-process command core; the default
 *          spawns the `stackra` binary.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local writes go through the same commands and gates as the CLI).
 */
import type { CommandOutcome } from "#node/types/command-outcome.type";

/** Runs one `stackra` command, its arguments without the program name. */
export type StackraRunner = (args: readonly string[]) => Promise<CommandOutcome>;
