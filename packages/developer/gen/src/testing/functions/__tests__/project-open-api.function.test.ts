/**
 * Stackra file contract:
 * Purpose: unit tests of `projectOpenApi`: the projection of a manifest equals what `openApiOf` projects, in the JSON
 *          form a committed file has, so it compares equal to the file `loadOpenApi` reads back.
 * Boundary: test only; projects the manifest built from the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0158.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { openApiOf } from "#core/functions/open-api-of.function";
import { projectOpenApi } from "#testing/functions/project-open-api.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

describe("projectOpenApi", () => {
  it("projects the manifest in committed JSON form", async () => {
    const { manifest } = buildManifest(COMMERCE_IR);
    const projected = await projectOpenApi(manifest);
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(projected).toEqual(JSON.parse(JSON.stringify(openApiOf(manifest))));
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(JSON.parse(JSON.stringify(projected))).toEqual(projected);
  });
});
