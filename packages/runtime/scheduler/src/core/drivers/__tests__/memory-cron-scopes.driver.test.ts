/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCronScopesDriver`: it lists no scope until one is set, then a copy of the scopes set.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0323.
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CronScopes } from "#contracts/index";
import { MemoryCronScopesDriver } from "#core/drivers/memory-cron-scopes.driver";

const scope: ScopeRef = { id: "scp_1", path: "platform.acme" };

describe(MemoryCronScopesDriver, () => {
  it("is a CronScopes that lists nothing until scopes are set", async () => {
    const driver = new MemoryCronScopesDriver();
    expect(driver).toBeInstanceOf(CronScopes);
    await expect(driver.list()).resolves.toEqual([]);
  });

  it("lists a copy of the scopes set", async () => {
    const driver = new MemoryCronScopesDriver();
    driver.scopes = [scope];
    const listed = await driver.list();
    expect(listed).toEqual([scope]);
    expect(listed).not.toBe(driver.scopes);
  });
});
