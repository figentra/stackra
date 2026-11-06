#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `runway` binary (package.json `bin`, built to `dist/runway.mjs`; `pnpm runway` is its alias): runs
 *          `RUNWAY_COMMANDS` on @stackra/console (ADR 0506 decision 8): plan, deploy, promote, rollback, status,
 *          validate, drift and `secrets sync`, in the repository the working directory is in. Usage errors exit 2,
 *          failures 1, drift and validation findings 1; `--json` gives each command's data in the envelope.
 * Boundary: the only file with a side effect on import; nothing imports it. git and gh run through the commands
 *           (`runwayIo`); the secret sync writes only in a proved CI job and prints names only.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0173; ADR 0352; ADR 0506; STA-268; STA-606; STA-2100.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createConsole } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";

import { RUNWAY_COMMANDS } from "#node/constants/runway-commands.constant";

/** The version of the @stackra/runway package this binary ships in (`dist/` or `src/node/`). */
function runwayVersion(): string {
  for (let folder = dirname(fileURLToPath(import.meta.url)); ; folder = dirname(folder)) {
    const file = join(folder, "package.json");
    if (existsSync(file)) {
      const { name, version } = JSON.parse(readFileSync(file, "utf8")) as {
        name?: unknown;
        version?: unknown;
      };
      if (name === "@stackra/runway" && typeof version === "string") return version;
    }
    if (dirname(folder) === folder) return "0.0.0";
  }
}

process.exitCode = await createConsole({
  name: "runway",
  version: runwayVersion(),
  commands: RUNWAY_COMMANDS,
  requireCommand: true,
}).run(process.argv.slice(2), nodePorts());
