/**
 * Stackra file contract:
 * Purpose: unit tests of `tenantOf`: a tenant node is its own tenant, a branch belongs to its nearest tenant (a child
 *          tenant before its parent), and a scope above every tenant has none.
 * Boundary: test only; the tree is the scope package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 8); stackra-310.
 */
import { MemoryScopeTreeDriver } from "@stackra/scope";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { tenantOf } from "#core/functions/tenant-of.function";

const entry = (id: string, path: string, level: string): ScopeEntry => ({
  id: `scp_01j9z3k4m5n6p7q8r9s0t1v2${id}`,
  path,
  level,
  name: path,
});

const ROOT = entry("w0", "platform", "platform");
const PARENT = entry("w1", "platform.acme", "tenant");
const CHILD = entry("w2", "platform.acme.shop_eu", "tenant");
const BRANCH = entry("w3", "platform.acme.shop_eu.riyadh", "branch");

const tree = new MemoryScopeTreeDriver().seed([ROOT, PARENT, CHILD, BRANCH]);

describe("tenantOf", () => {
  it("answers a tenant node itself", async () => {
    await expect(tenantOf(tree, PARENT)).resolves.toBe(PARENT.id);
  });

  it("answers a branch's nearest tenant, the child before its parent", async () => {
    await expect(tenantOf(tree, BRANCH)).resolves.toBe(CHILD.id);
  });

  it("answers no tenant for a scope above every tenant", async () => {
    await expect(tenantOf(tree, ROOT)).resolves.toBeUndefined();
  });
});
