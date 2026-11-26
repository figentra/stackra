/**
 * Stackra file contract:
 * Purpose: `CliRuntime`, what a `stackra` command class gets from the run that dispatched it: whether its tools may take the
 *          terminal (the binary: yes; the local MCP's capture: no), and how to run another `stackra` command line
 *          in-process from a working directory.
 * Boundary: type only; `runCli` holds it in `CLI_RUNTIME_STORE` for its run, and `currentCliRuntime` falls back to
 *           `PIPED_RUNTIME` outside one.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the MCP runs the same commands); ADR 0506; ADR 0500 (decision 7);
 *                     STA-2883.
 */
import type { CliIo } from "#node/types/cli-io.type";

/** The run around a command class. */
export type CliRuntime = {
  /** A started tool inherits the terminal (the binary); false when its output is piped into the run (an MCP capture). */
  readonly inherit: boolean;

  /** Runs another `stackra` command line from `cwd` with the same commands and resolves with its exit code. */
  readonly cli: (args: readonly string[], io: CliIo, cwd: string) => Promise<number>;
};
