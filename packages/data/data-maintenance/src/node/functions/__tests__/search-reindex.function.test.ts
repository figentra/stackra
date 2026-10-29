/**
 * Stackra file contract:
 * Purpose: unit tests of the connection string `searchReindex` uses: `directDatabaseUrl()` of @stackra/database/node,
 *          so it refuses before connecting when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set (STA-1409).
 * Boundary: test only; no database: the refusal comes before any connection.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0473 (decision 3: the direct URL).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { searchReindex } from "#node/functions/search-reindex.function";

describe("searchReindex", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses when neither direct nor pooled URL is set", async () => {
    vi.stubEnv("DATABASE_DIRECT_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    await expect(searchReindex({})).rejects.toThrow(
      "DATABASE_DIRECT_URL (or DATABASE_URL) is not set",
    );
  });
});
