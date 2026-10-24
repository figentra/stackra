#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `stackra` binary (package.json `bin`, built to `dist/stackra.mjs`): runs the command line through
 *          `runCli` with this process's streams and exits with its code.
 * Boundary: the only file with a side effect on import; nothing imports it.
 * Runtime: node
 * Governing contract: ADR 0083 (`@stackra/cli` is the `stackra` binary); ADR 0282 (decision 3).
 */
import { PROCESS_IO } from "#node/constants/process-io.constant";
import { runCli } from "#node/functions/run-cli.function";

process.exitCode = await runCli(process.argv.slice(2), PROCESS_IO);
