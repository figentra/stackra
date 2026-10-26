#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `brand-kit` binary (package.json `bin`, built to `dist/brand-kit.mjs`): runs the command line through
 *          `runBrandKit` with this process's streams and `STACKRA_BRAND_KITS`, and exits with its code.
 * Boundary: the only file with a side effect on import; nothing imports it.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 5: Runway runs the generator in CI).
 */
import { runBrandKit } from "#node/functions/run-brand-kit.function";

process.exitCode = await runBrandKit(
  process.argv.slice(2),
  {
    out: (text) => void process.stdout.write(text),
    err: (text) => void process.stderr.write(text),
  },
  process.env["STACKRA_BRAND_KITS"],
);
