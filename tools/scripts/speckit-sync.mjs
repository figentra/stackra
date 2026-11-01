#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/speckit-sync.mjs` is `figentra-flow sync`, kept for the docs that name it.
 * Boundary: no logic of its own; Figentra Flow (@figentra-oss/flow) holds it and its tests.
 * Runtime: node
 * Governing contract: ADR 0503 (Figentra Flow runs the development workflow); STA-1729 (W2).
 * Secrets: none.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The CLI beside the package's exported gate entry (src/commands/gate.mjs → bin/figentra-flow.mjs).
const bin = fileURLToPath(
  new URL("../../bin/figentra-flow.mjs", import.meta.resolve("@figentra-oss/flow/gate")),
);
const r = spawnSync(process.execPath, [bin, "sync", ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exitCode = r.status ?? 1;
