/**
 * Stackra file contract:
 * Purpose: unit tests of `TenancyCronScopesDriver`: it is the scheduler's `CronScopes`; it lists every tenant node
 *          below the root, child tenants included, as plain scope refs, and skips the root and other levels; a tree
 *          that shows no root lists none.
 * Boundary: test only; the tree is the scope package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 5); ADR 0327 (decision 8).
 */
import { buildConfig } from "@stackra/config";
import { CronScopes } from "@stackra/scheduler/contracts";
import { MemoryScopeTreeDriver, ScopeConfig } from "@stackra/scope";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenancyCronScopesDriver } from "#core/drivers/tenancy-cron-scopes.driver";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const PRODUCT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};
const ORGANISATION: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.acme.group",
  level: "tenant",
  name: "Group",
};
const SHOP: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.acme.group.shop_eu",
  level: "tenant",
  name: "Shop EU",
};

const config = buildConfig(ScopeConfig);

describe(TenancyCronScopesDriver, () => {
  it("is a CronScopes that lists every tenant, child tenants included, as scope refs", async () => {
    const driver = new TenancyCronScopesDriver(
      new MemoryScopeTreeDriver([ROOT, PRODUCT, ORGANISATION, SHOP]),
      config,
    );
    expect(driver).toBeInstanceOf(CronScopes);
    await expect(driver.list()).resolves.toEqual([
      { id: ORGANISATION.id, path: ORGANISATION.path },
      { id: SHOP.id, path: SHOP.path },
    ]);
  });

  it("lists none when the tree shows no root", async () => {
    const driver = new TenancyCronScopesDriver(new MemoryScopeTreeDriver([PRODUCT, SHOP]), config);
    await expect(driver.list()).resolves.toEqual([]);
  });
});
