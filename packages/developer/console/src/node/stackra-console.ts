#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `stackra-console` binary (package.json `bin`, built to `dist/stackra-console.mjs`): a console of its
 *          own, built on this package, whose command is `create`.
 * Boundary: the only file with a side effect on import; nothing imports it.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-029; ADR 0506.
 */
import { createConsole } from "#core/functions/create-console.function";
import { CreateCommand } from "#node/commands/create.command";
import { nodePorts } from "#node/functions/node-ports.function";
import { ownVersion } from "#node/functions/own-version.function";

process.exitCode = await createConsole({
  name: "stackra-console",
  version: ownVersion(),
  commands: [CreateCommand],
}).run(process.argv.slice(2), nodePorts());
