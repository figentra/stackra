/**
 * Stackra file contract:
 * Purpose: `CLI_RUNTIME_STORE`, the `CliRuntime` of the `stackra` run in progress, held for the run's async calls:
 *          `runCli` enters it around one console run, so every command class it dispatches (and a run nested through
 *          `context.cli`, which enters its own) reads the runtime of the run that called it.
 * Boundary: holds nothing outside a run; `currentCliRuntime` reads it. Command classes take no constructor argument,
 *           so gen's injection rules see none (ADR 0294) and the console builds them as it builds any command.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the MCP runs the same commands); ADR 0506; STA-2883.
 */
import { AsyncLocalStorage } from "node:async_hooks";

import type { CliRuntime } from "#node/types/cli-runtime.type";

/** The runtime of the `stackra` run in progress. */
export const CLI_RUNTIME_STORE = new AsyncLocalStorage<CliRuntime>();
