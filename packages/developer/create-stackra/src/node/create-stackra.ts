#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `create-stackra` binary (package.json `bin`, built to `dist/create-stackra.mjs`), what
 *          `npm create stackra` and `pnpm create stackra` run: hands the arguments to `runCreateStackra` with this
 *          process's host and exits with its code.
 * Boundary: the only file with a side effect on import; nothing imports it.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27: the initializer is `create-stackra`); ADR 0453 (decision 10).
 */
import { PROCESS_HOST } from "#node/constants/process-host.constant";
import { runCreateStackra } from "#node/functions/run-create-stackra.function";

process.exitCode = await runCreateStackra(process.argv.slice(2), PROCESS_HOST);
