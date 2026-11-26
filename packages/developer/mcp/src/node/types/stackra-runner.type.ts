/**
 * Stackra file contract:
 * Purpose: `StackraRunner`, how the local MCP runs a `stackra` command (`["gen", "--check"]`), so every write goes
 *          through the CLI's own commands and gates. `@stackra/cli` passes its in-process command core; the default
 *          spawns the `stackra` binary. `cwd` runs it in one member's folder.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local writes go through the same commands and gates as the CLI).
 */
import type { CommandOutcome } from "#node/types/command-outcome.type";

/**
 * Runs one `stackra` command, its arguments without the program name; in `cwd` (an absolute folder inside the
 * repository, such as a member) when given, else in the repository root.
 */
export type StackraRunner = (
  args: readonly string[],
  options?: { readonly cwd?: string },
) => Promise<CommandOutcome>;
