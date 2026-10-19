#!/usr/bin/env node
// `pnpm test` / `turbo run test` entry for the backend.
//
// `encore test` provisions the test infrastructure (Postgres per service, pub/sub, cache) and
// then runs this package's `test` script with ENCORE_RUNTIME_LIB set — so: inside Encore, run
// Vitest; outside it (turbo, a plain `pnpm test`), hand over to `encore test`, which calls back.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const inside = Boolean(process.env.ENCORE_RUNTIME_LIB);
const [cmd, cmdArgs] = inside ? ["vitest", ["run", ...args]] : ["encore", ["test", ...args]];
const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: process.platform === "win32" });
if (r.error) {
  console.error(
    inside
      ? r.error.message
      : "The Encore CLI is required to run backend tests (https://encore.dev/docs/install).",
  );
  process.exit(1);
}
process.exit(r.status ?? 1);
