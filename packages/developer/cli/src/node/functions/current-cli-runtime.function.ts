/**
 * Stackra file contract:
 * Purpose: `currentCliRuntime()`, the `CliRuntime` of the `stackra` run in progress (`runCli`), or `PIPED_RUNTIME`
 *          outside one (a command class run by the console's test runner, a tool list): its tools never take the
 *          terminal there.
 * Boundary: reads `CLI_RUNTIME_STORE` only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0506; STA-2883.
 */
import { CLI_RUNTIME_STORE } from "#node/constants/cli-runtime-store.constant";
import { PIPED_RUNTIME } from "#node/constants/piped-runtime.constant";
import type { CliRuntime } from "#node/types/cli-runtime.type";

/**
 * The runtime of the run in progress.
 *
 * @example
 * const { inherit } = currentCliRuntime(); // true under the `stackra` binary, false in an MCP capture or a test
 */
export function currentCliRuntime(): CliRuntime {
  return CLI_RUNTIME_STORE.getStore() ?? PIPED_RUNTIME;
}
