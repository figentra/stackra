/**
 * Stackra file contract:
 * Purpose: unit tests of the connection string `searchReindex` and `searchStatus` use: `directDatabaseUrl()` of
 *          @stackra/database/node, so both refuse before connecting when neither `DATABASE_DIRECT_URL` nor
 *          `DATABASE_URL` is set (STA-1409).
 * Boundary: test only; no database: the refusal comes before any connection.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0473 (decision 3: the direct URL).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { searchReindex } from "#node/functions/search-reindex.function";
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

  it("searchReindex refuses when neither direct nor pooled URL is set", async () => {
    unset();
    await expect(searchReindex({})).rejects.toThrow(
      "DATABASE_DIRECT_URL (or DATABASE_URL) is not set",
    );
  });
});
