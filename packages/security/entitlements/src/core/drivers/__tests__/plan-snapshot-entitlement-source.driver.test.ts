/**
 * Stackra file contract:
 * Purpose: unit tests of `PlanSnapshotEntitlementSourceDriver` over `MemoryPlanSnapshotsDriver`: it is an
 *          `EntitlementSource`; it answers a grant by the entitlement's locked key in the scope's plan; a scope with no
 *          plan or a plan without the key answers `undefined`; an unregistered class throws; loading raises the version;
 *          a key answers the same record as its class, and a malformed key throws (STA-1225).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0215 (decisions 1, 5 and 6); owner round 3 #18.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { MemoryPlanSnapshotsDriver } from "#core/drivers/memory-plan-snapshots.driver";
import { PlanSnapshotEntitlementSourceDriver } from "#core/drivers/plan-snapshot-entitlement-source.driver";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { registerEntitlements } from "#core/functions/register-entitlements.function";

class Product {}

class ProductLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Product,
}) {}

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

class UnregisteredEntitlement extends Entitlement({ kind: EntitlementKind.Module }) {}

const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1";

describe("PlanSnapshotEntitlementSourceDriver", () => {
  let snapshots: MemoryPlanSnapshotsDriver;
  let source: PlanSnapshotEntitlementSourceDriver;

  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      { type: ProductLimitEntitlement, key: "catalogue.product_limit", gates: [] },
      { type: ReportsEntitlement, key: "reports.reports", gates: [] },
    ]);
    snapshots = new MemoryPlanSnapshotsDriver();
    source = new PlanSnapshotEntitlementSourceDriver(snapshots);
  });

  it("is an EntitlementSource", () => {
    expect(source).toBeInstanceOf(EntitlementSource);
  });

  it("answers the grant of the scope's plan by locked key", async () => {
    snapshots.load(ACME, { grants: { "catalogue.product_limit": { limit: 2 } }, seats: {} });
    expect(await source.grant(ProductLimitEntitlement, ACME)).toEqual({ limit: 2 });
    expect(await source.grant(ReportsEntitlement, ACME)).toBeUndefined();
    expect(await source.grant(ProductLimitEntitlement, undefined)).toBeUndefined();
  });

  it("refuses an unregistered entitlement", async () => {
    await expect(source.grant(UnregisteredEntitlement, ACME)).rejects.toThrow(TypeError);
  });

  it("answers a key and its class from the same record", async () => {
    snapshots.load(ACME, {
      grants: { "catalogue.product_limit": { limit: 2 }, billing: true },
      seats: {},
    });
    expect(await source.grant("catalogue.product_limit", ACME)).toEqual(
      await source.grant(ProductLimitEntitlement, ACME),
    );
    expect(await source.grant("billing", ACME)).toBe(true);
    expect(await source.grant("payroll", ACME)).toBeUndefined();
  });

  it("refuses a malformed key", async () => {
    await expect(source.grant("Not A Key", ACME)).rejects.toThrow(TypeError);
  });

  it("raises the version on every load", async () => {
    snapshots.load(ACME, { grants: {}, seats: {} });
    snapshots.load(ACME, { grants: {}, seats: {} });
    expect((await snapshots.read(ACME))?.version).toBe(2);
  });
});
