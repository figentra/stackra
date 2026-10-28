/**
 * Stackra file contract:
 * Purpose: unit tests of `POSTGRES_TEST_IMAGE`: the Dockerfile starts from the PostGIS image of the current Postgres
 *          major and adds the pgvector package of the same major, and the tag names both.
 * Boundary: test only; no Docker (the build itself is covered by `use-postgres.int.test.ts`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0160; ADR 0314; gap db19 (stackra-284).
 */
import { describe, expect, it } from "@stackra/testing";

import { POSTGRES_TEST_IMAGE } from "#testing/constants/postgres-test-image.constant";

describe("POSTGRES_TEST_IMAGE", () => {
  it("builds on the PostGIS image and adds pgvector for the same Postgres major", () => {
    const [from] = POSTGRES_TEST_IMAGE.dockerfile.split("\n");
    expect(from).toBe("FROM postgis/postgis:18-3.6");
    expect(POSTGRES_TEST_IMAGE.dockerfile).toContain("postgresql-18-pgvector");
  });

  it("names Postgres, PostGIS and pgvector in its tag", () => {
    expect(POSTGRES_TEST_IMAGE.tag).toMatch(/^stackra-postgres-test:18-postgis3\.6-pgvector$/);
  });
});
