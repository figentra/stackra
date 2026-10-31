/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantScopeOwnershipDriver`: a platform actor holds any scope; a tenant actor holds its own
 *          tenant's scope and a branch below it, and no other tenant's scope, a scope above every tenant, or none.
 * Boundary: test only; the tree is the scope package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495 (decision 2).
 */
import { ScopeOwnership } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenantScopeOwnershipDriver } from "#core/drivers/tenant-scope-ownership.driver";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "tenant",
  name: "Acme",
};
const GLOBEX: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.globex",
  level: "tenant",
  name: "Globex",
};
const BRANCH: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.acme.riyadh",
  level: "branch",
  name: "Riyadh",
};

const driver = new TenantScopeOwnershipDriver(
  new MemoryScopeTreeDriver().seed([ROOT, ACME, GLOBEX, BRANCH]),
);
const actorIn = (scopeId?: Actor["scopeId"]): Actor => ({
  kind: ActorKind.Service,
  id: "svc_orders",
  ...(scopeId === undefined ? {} : { scopeId }),
});

describe(TenantScopeOwnershipDriver, () => {
  it("is a ScopeOwnership driver", () => {
    expect(driver).toBeInstanceOf(ScopeOwnership);
  });

  it("holds any scope for a platform actor", async () => {
    await expect(driver.holds(actorIn(), ACME)).resolves.toBe(true);
    await expect(driver.holds(actorIn(), undefined)).resolves.toBe(true);
  });

  it("holds its own tenant's scope and a branch below it", async () => {
    await expect(driver.holds(actorIn(ACME.id), ACME)).resolves.toBe(true);
    await expect(driver.holds(actorIn(ACME.id), BRANCH)).resolves.toBe(true);
  });

  it("holds no other tenant's scope, no scope above every tenant and no absent scope", async () => {
    await expect(driver.holds(actorIn(ACME.id), GLOBEX)).resolves.toBe(false);
    await expect(driver.holds(actorIn(GLOBEX.id), BRANCH)).resolves.toBe(false);
    await expect(driver.holds(actorIn(ACME.id), ROOT)).resolves.toBe(false);
    await expect(driver.holds(actorIn(ACME.id), undefined)).resolves.toBe(false);
  });
});
