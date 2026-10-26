/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPlatformHosts`: every row `edgeRowsOf` computes is written in order and answered;
 *          a missing signing fact writes nothing.
 * Boundary: test only; the edge store is an in-memory fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 6 and 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { PRODUCT_ROOT, SIGNING } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { edgeRowsOf } from "#core/functions/edge-rows-of.function";
import { registerPlatformHosts } from "#core/functions/register-platform-hosts.function";
import { EdgeStore } from "#core/ports/edge-store.port";

/** An edge store in memory. */
class MemoryEdgeStore extends EdgeStore {
  readonly rows = new Map<string, string>();

  override async put(key: string, value: string): Promise<void> {
    this.rows.set(key, value);
  }

  override async delete(key: string): Promise<void> {
    this.rows.delete(key);
  }
}

describe("registerPlatformHosts", () => {
  it("writes every row and answers them", async () => {
    const store = new MemoryEdgeStore();

    const rows = await registerPlatformHosts(PRODUCT_ROOT, "production", store, SIGNING);

    expect(rows).toEqual(edgeRowsOf(PRODUCT_ROOT, "production", SIGNING));
    expect([...store.rows.keys()]).toEqual(rows.map((row) => row.key));
  });

  it("writes nothing when a signing fact is missing", async () => {
    const store = new MemoryEdgeStore();

    await expect(
      registerPlatformHosts(PRODUCT_ROOT, "production", store, { ...SIGNING, appleTeamIds: {} }),
    ).rejects.toThrow(/no Apple team id/);
    expect(store.rows.size).toBe(0);
  });
});
