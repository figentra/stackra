/**
 * Stackra file contract:
 * Purpose: unit tests of `readDependencyManifests`: a dependency's committed manifest found through node_modules, in
 *          package.json order and once each, a dependency without one skipped, and an invalid manifest refused.
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

  it("refuses an invalid manifest", () => {
    const root = writeFixtureMember("broken-host", {
      "node_modules/@acme/broken/stackra.manifest.json": "{ nope",
    });
    expect(() => readDependencyManifests(root, ["@acme/broken"])).toThrow(/is not valid JSON/);
  });
});
