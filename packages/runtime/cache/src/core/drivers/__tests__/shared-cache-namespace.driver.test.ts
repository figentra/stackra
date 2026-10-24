/**
 * Stackra file contract:
 * Purpose: unit tests of `SharedCacheNamespaceDriver`: a driver of the `CacheNamespace` port that always names the
 *          shared namespace `""`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";

describe("SharedCacheNamespaceDriver", () => {
  it("is a driver of CacheNamespace naming the shared namespace", () => {
    const driver = new SharedCacheNamespaceDriver();
    expect(driver).toBeInstanceOf(CacheNamespace);
    expect(driver.current()).toBe("");
  });
});
