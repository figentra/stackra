/**
 * Stackra file contract:
 * Purpose: unit tests of `SEARCH_CONFIG_SCHEMA`: the full default from `{}`, the driver names closed to the shipped
 *          drivers, and the generated host form `Base$.extend(...)`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";

describe("SEARCH_CONFIG_SCHEMA", () => {
  it("parses {} to the default", () => {
    expect(SEARCH_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "postgres",
      embedder: {
        url: null,
        model: "",
        dimensions: 1024,
        tokenSecret: null,
        passageCharacters: 2000,
        passageOverlap: 200,
      },
      health: { timeout: "PT2S", critical: true, table: "", primaryKey: "id" },
    });
  });

  it("refuses a passage overlap that is not under the passage size", () => {
    const embedder = { passageCharacters: 500, passageOverlap: 500 };
    expect(SEARCH_CONFIG_SCHEMA.safeParse({ embedder }).success).toBe(false);
    expect(
      SEARCH_CONFIG_SCHEMA.parse({ embedder: { ...embedder, passageOverlap: 50 } }).embedder,
    ).toMatchObject({ passageCharacters: 500, passageOverlap: 50 });
  });

  it("takes the shipped drivers and refuses others", () => {
    expect(SEARCH_CONFIG_SCHEMA.parse({ driver: "memory" }).driver).toBe("memory");
    expect(SEARCH_CONFIG_SCHEMA.safeParse({ driver: "opensearch" }).success).toBe(false);
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = SEARCH_CONFIG_SCHEMA.extend({
      driver: SEARCH_CONFIG_SCHEMA.shape.driver.unwrap().default("memory"),
    });
    expect(Host$.parse({}).driver).toBe("memory");
  });
});
