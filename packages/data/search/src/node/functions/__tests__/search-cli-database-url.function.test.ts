/**
 * Stackra file contract:
 * Purpose: unit tests of the connection string `searchStatus` uses: `directDatabaseUrl()` of @stackra/database/node,
 *          so it refuses before connecting when neither `DATABASE_DIRECT_URL` nor `DATABASE_URL` is set (STA-1409).
 *          The `searchReindex` runner moved to @stackra/data-maintenance with the reindex jobs, and its test with it.
 * Boundary: test only; no database: the refusal comes before any connection.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0473 (decision 3: the direct URL).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { searchStatus } from "#node/functions/search-status.function";

/** Clears both connection strings for one test. */
function unset(): void {
  vi.stubEnv("DATABASE_DIRECT_URL", "");
  vi.stubEnv("DATABASE_URL", "");
}

describe("search CLI connection string", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("searchStatus refuses when neither direct nor pooled URL is set", async () => {
    unset();
    await expect(searchStatus()).rejects.toThrow(
      "DATABASE_DIRECT_URL (or DATABASE_URL) is not set",
    );
  });
});
