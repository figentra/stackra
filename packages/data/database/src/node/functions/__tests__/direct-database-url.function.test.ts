/**
 * Stackra file contract:
 * Purpose: unit tests of `directDatabaseUrl`: the direct URL wins over the pooled one, an empty value counts as unset,
 *          and a member with neither is refused.
 * Boundary: test only; the URLs are made up and `process.env` is never read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0473 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { directDatabaseUrl } from "#node/functions/direct-database-url.function";

describe("directDatabaseUrl", () => {
  it("takes the direct URL over the pooled one", () => {
    expect(
      directDatabaseUrl({
        DATABASE_DIRECT_URL: "postgres://server/app",
        DATABASE_URL: "postgres://proxy/app",
      }),
    ).toBe("postgres://server/app");
  });

  it("falls back to DATABASE_URL when no proxy stands in front", () => {
    expect(
      directDatabaseUrl({ DATABASE_DIRECT_URL: "", DATABASE_URL: "postgres://localhost/app" }),
    ).toBe("postgres://localhost/app");
  });

  it("refuses a member with neither", () => {
    expect(() => directDatabaseUrl({})).toThrow(/DATABASE_DIRECT_URL/);
  });
});
