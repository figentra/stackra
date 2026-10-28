/**
 * Stackra file contract:
 * Purpose: unit tests of `readDependencyManifests`: a dependency's committed manifest found through node_modules, in
 *          package.json order and once each, a dependency without one skipped, none above the repository root (the
 *          folder holding `pnpm-workspace.yaml`), and an invalid manifest refused.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { readDependencyManifests } from "#node/functions/read-dependency-manifests.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readDependencyManifests", () => {
  it("reads each committed manifest in order", () => {
    const manifest = { member: "loyalty_kit", package: "@acme/loyalty-kit", version: "0.4.0" };
    const root = writeFixtureMember("host", {
      "node_modules/@acme/loyalty-kit/stackra.manifest.json": JSON.stringify(manifest),
      "node_modules/@acme/plain/package.json": JSON.stringify({ name: "@acme/plain" }),
    });
    expect(
      readDependencyManifests(root, ["@acme/plain", "@acme/loyalty-kit", "@acme/loyalty-kit"]),
    ).toEqual([{ package: "@acme/loyalty-kit", manifest }]);
  });

  it("never reads a manifest above the repository root", () => {
    const manifest = { member: "errors", package: "@acme/errors", version: "1.0.0" };
    const outer = writeFixtureMember("outer", {
      "node_modules/@acme/errors/stackra.manifest.json": JSON.stringify(manifest),
      "workspace/pnpm-workspace.yaml": "packages: []\n",
    });
    expect(readDependencyManifests(`${outer}/workspace/services/shop`, ["@acme/errors"])).toEqual(
      [],
    );
    expect(readDependencyManifests(`${outer}/workspace`, ["@acme/errors"])).toEqual([]);
    expect(readDependencyManifests(outer, ["@acme/errors"])).toEqual([
      { package: "@acme/errors", manifest },
    ]);
  });

  it("refuses an invalid manifest", () => {
    const root = writeFixtureMember("broken-host", {
      "node_modules/@acme/broken/stackra.manifest.json": "{ nope",
    });
    expect(() => readDependencyManifests(root, ["@acme/broken"])).toThrow(/is not valid JSON/);
  });
});
