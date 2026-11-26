/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimeOnlyFieldsOf`: a service that installs a package mapping `STACKRA_ENVIRONMENT` gives
 *          that field; a repository without a root runway still reads its own dependencies (STA-2844).
 * Boundary: test only; builds repositories in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { runtimeOnlyFieldsOf } from "#node/functions/runtime-only-fields-of.function";

/** A repository from `files` (path → text). */
function repository(files: Readonly<Record<string, string>>): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-runtime-only-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), text);
  }
  return folder;
}

/** A package manifest mapping `market_packs.environment` to the running environment. */
const PACKS = JSON.stringify({
  env: [{ name: "STACKRA_ENVIRONMENT", config: "market_packs", field: "environment" }],
});

const FIELD = { config: "market_packs", field: "environment", variable: "STACKRA_ENVIRONMENT" };

describe("runtimeOnlyFieldsOf", () => {
  it("reads the packages a service installs", () => {
    const root = repository({
      "runway.yaml": "version: 3\n",
      "services/api/runway.yaml": "version: 3\n",
      "services/api/package.json": JSON.stringify({
        dependencies: { "@stackra/market-packs": "1" },
      }),
      "services/api/node_modules/@stackra/market-packs/stackra.manifest.json": PACKS,
    });
    expect(runtimeOnlyFieldsOf(root)).toEqual([FIELD]);
  });

  it("reads the root's own dependencies when there is no root runway", () => {
    const root = repository({
      "package.json": JSON.stringify({ dependencies: { "@stackra/market-packs": "1" } }),
      "node_modules/@stackra/market-packs/stackra.manifest.json": PACKS,
    });
    expect(runtimeOnlyFieldsOf(root)).toEqual([FIELD]);
  });
});
