/**
 * Stackra file contract:
 * Purpose: unit tests of `loadOpenApi`: a committed document read as is, and a missing or non-OpenAPI file refused.
 * Boundary: test only; writes small files under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0158.
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { loadOpenApi } from "#testing/functions/load-open-api.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("loadOpenApi", () => {
  const document = {
    $comment: "x",
    openapi: "3.1.0",
    info: { title: "t", version: "1", "x-stackra-member": "m" },
    paths: {},
    components: { schemas: {}, responses: {} },
  };
  const root = writeFixtureMember("openapi", {
    "openapi.json": JSON.stringify(document),
    "other.json": JSON.stringify({ swagger: "2.0" }),
  });

  it("reads the document", async () => {
    expect(await loadOpenApi(join(root, "openapi.json"))).toEqual(document);
  });

  it("refuses a missing or foreign file", async () => {
    await expect(loadOpenApi(join(root, "missing.json"))).rejects.toThrow(
      /cannot read the OpenAPI document/,
    );
    await expect(loadOpenApi(join(root, "other.json"))).rejects.toThrow(
      /is not an OpenAPI document/,
    );
  });
});
