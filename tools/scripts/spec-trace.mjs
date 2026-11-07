#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/spec-trace.mjs …`, kept for the docs that name it: the trace is `fflow trace`;
 *   this re-exports it and runs it when called directly.
 * Boundary: no logic of its own; Figentra Flow (@figentra-oss/flow) holds it and its tests.
 * Runtime: node
 * Governing contract: ADR 0503 (Figentra Flow runs the development workflow); STA-1729 (W2).
 * Secrets: none.
 */
import { pathToFileURL } from "node:url";

export * from "@figentra-oss/flow/trace";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { run } = await import("@figentra-oss/flow/trace");
  process.exitCode = await run(process.argv.slice(2));
}
