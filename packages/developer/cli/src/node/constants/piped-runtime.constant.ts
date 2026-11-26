/**
 * Stackra file contract:
 * Purpose: `PIPED_RUNTIME`, the `CliRuntime` of a command class run outside `runCli` (a test, a tool list): its
 *          tools never take the terminal, and another command line runs through `runCli` over `COMMANDS`.
 * Boundary: data only; `runCli` is imported when a command first runs another, so the command list and this constant
 *           never import each other at load.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0506; STA-2883.
 */
import type { CliRuntime } from "#node/types/cli-runtime.type";

/** The runtime of a command built outside `runCli`. */
export const PIPED_RUNTIME: CliRuntime = Object.freeze({
  inherit: false,
  cli: async (args, io, cwd) => {
    const { runCli } = await import("#node/functions/run-cli.function");
    return runCli(args, io, { cwd });
  },
});
