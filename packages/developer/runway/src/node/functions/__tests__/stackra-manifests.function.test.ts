/**
 * Stackra file contract:
 * Purpose: unit tests of `stackraManifests`: a member's own manifest, each dependency's from the member's
 *          `node_modules` and else the repository's, and each workspace package's are read; a dependency without a
 *          manifest and an unparsable one are skipped (STA-2844).
 * Boundary: test only; builds a repository in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { stackraManifests } from "#node/functions/stackra-manifests.function";

/** A repository from `files` (path → text). */
function repository(files: Readonly<Record<string, string>>): string {
  const folder = mkdtempSync(join(tmpdir(), "runway-manifests-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), text);
  }
  return folder;
}

describe("stackraManifests", () => {
  it("reads the member's, its dependencies' and the workspace packages' manifests", () => {
    const root = repository({
      "package.json": JSON.stringify({ devDependencies: { "@acme/tools": "1.0.0" } }),
      "node_modules/@acme/tools/stackra.manifest.json": JSON.stringify({ package: "@acme/tools" }),
      "node_modules/@stackra/actions/stackra.manifest.json": JSON.stringify({
        package: "@stackra/actions",
      }),
      "services/api/package.json": JSON.stringify({
        dependencies: { "@stackra/outbox": "1", "@stackra/actions": "1", "left-pad": "1" },
      }),
      "services/api/stackra.manifest.json": JSON.stringify({ package: "@acme/service-api" }),
      "services/api/node_modules/@stackra/outbox/stackra.manifest.json": JSON.stringify({
        package: "@stackra/outbox",
      }),
      "packages/kit/package.json": JSON.stringify({ name: "@acme/kit", version: "1.0.0" }),
      "packages/kit/stackra.manifest.json": JSON.stringify({ package: "@acme/kit" }),
      "packages/broken/package.json": JSON.stringify({ name: "@acme/broken", version: "1.0.0" }),
      "packages/broken/stackra.manifest.json": "{ not json",
    });
    const names = stackraManifests(root, [{ member: "api", folder: "services", runway: {} }]).map(
      (manifest) => (manifest as { package: string }).package,
    );
    expect(names.sort()).toEqual([
      "@acme/kit",
      "@acme/service-api",
      "@acme/tools",
      "@stackra/actions",
      "@stackra/outbox",
    ]);
  });
});
