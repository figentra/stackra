#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `stackra-brand-kit` binary (package.json `bin`, built to `dist/brand-kit.mjs`): parses the flags, runs
 *          the generator or `--check`, prints each issue and exits 1 when the check fails or the kit is invalid.
 * Boundary: the only file with a side effect on import; nothing imports it. Runway's brand step (stackra-13) calls
 *           `runBrandKit` directly.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: the brand kit runs in CI as a Runway step).
 */
import { parseBrandKitArgs } from "#core/functions/parse-brand-kit-args.function";
import { runBrandKit } from "#core/functions/run-brand-kit.function";

try {
  const result = await runBrandKit(parseBrandKitArgs(process.argv.slice(2)));
  for (const issue of result.issues)
    process.stderr.write(`${issue.code} ${issue.path}: ${issue.message}\n`);
  process.stdout.write(
    `${result.ok ? "ok" : "failed"}: ${result.manifest.files.length} files, kit ${result.manifest.kit}\n`,
  );
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  const problems = (error as { problems?: readonly string[] }).problems;
  process.stderr.write(`${problems ? problems.join("\n") : String(error)}\n`);
  process.exitCode = 1;
}
