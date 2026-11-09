#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/spec-gate.mjs …`, kept for the plan-gate hook and setup-plan.sh: the spec gate is
 *   `fflow gate`; this re-exports it and runs it when called directly.
 * Boundary: no logic of its own; Figentra Flow (@figentra-oss/flow) holds it and its tests.
 * Runtime: node
 * Governing contract: ADR 0503 (Figentra Flow runs the development workflow); STA-1729 (W2).
 * Secrets: none.
 */
import { pathToFileURL } from "node:url";

export * from "@figentra-oss/flow/gate";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { run } = await import("@figentra-oss/flow/gate");
  process.exitCode = await run(process.argv.slice(2));
}
