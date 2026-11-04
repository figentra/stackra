/**
 * Stackra file contract:
 * Purpose: unit tests of `readRunways`: the root runway and every member runway under `apps/`, `services/` and
 *          `workers/`, each with its member root, parsed as plain YAML; a member folder without a runway and a
 *          missing member root are skipped; a missing root runway fails.
 * Boundary: test only; writes a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; ADR 0296; ADR 0284.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readRunways } from "#node/functions/read-runways.function";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-runways-"));
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

/** Writes `text` at `path` under the repository. */
function put(path: string, text: string): void {
  mkdirSync(dirname(join(repository, path)), { recursive: true });
  writeFileSync(join(repository, path), text);
}

describe("readRunways", () => {
  it("reads the root runway and every member runway with its member root", () => {
    put("runway.yaml", "version: 3\nproject: acme\n");
    put("services/api/runway.yaml", "secrets:\n  - STRIPE_SECRET_KEY\n");
    put("workers/edge/runway.yaml", "secrets: []\n");
    put("apps/console/package.json", "{}");

    const runways = readRunways(repository);

    expect(runways.root).toEqual({ version: 3, project: "acme" });
    expect(runways.members).toEqual([
      { member: "api", folder: "services", runway: { secrets: ["STRIPE_SECRET_KEY"] } },
      { member: "edge", folder: "workers", runway: { secrets: [] } },
    ]);
  });

  it("fails without a root runway", () => {
    put("services/api/runway.yaml", "secrets: []\n");

    expect(() => readRunways(repository)).toThrow(/ENOENT/);
  });
});
