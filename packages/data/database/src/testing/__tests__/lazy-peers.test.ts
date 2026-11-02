/**
 * Stackra file contract:
 * Purpose: unit tests that `./testing` loads none of the optional test-only peers (Faker, PGlite, its extensions,
 *          pgvector, the MikroORM PGlite driver, Testcontainers) when it is imported.
 * Boundary: test only. Each peer is mocked to throw when it is evaluated, so an eager `import` of any of them makes
 *           the dynamic import of the entry reject. The loader itself uses `createRequire`, which the mocks do not
 *           reach; its missing-package text is tested in `require-test-peer.function.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3); ADR 0022; STA-1812; STA-1950.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

for (const name of [
  "@faker-js/faker",
  "@electric-sql/pglite",
  "@electric-sql/pglite/contrib/citext",
  "@electric-sql/pglite/contrib/ltree",
  "@electric-sql/pglite/contrib/pg_trgm",
  "@electric-sql/pglite/contrib/pgcrypto",
  "@electric-sql/pglite-pgvector",
  "@mikro-orm/pglite",
  "@testcontainers/postgresql",
  "testcontainers",
])
  vi.doMock(name, () => {
    throw new Error(`${name} was loaded when ./testing was imported`);
  });

describe("@stackra/database/testing", () => {
  it("imports without loading the optional test peers", async () => {
    await expect(import("#testing/index")).resolves.toBeDefined();
  });
});
