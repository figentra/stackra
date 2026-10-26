/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/entitlements`
 *          (`Entitlement`, `EntitlementKind`, `EntitlementSource`, `LimitReachedError`) and the registry row's plan
 *          driver, usage port and registration, and the limit-grant helpers (stackra-117) are exported, nothing else is, the registry stays internal, and the
 *          public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); STA-1225 (`isEntitled`).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as entitlements from "#core/index";
import type {
  EntitlementClass,
  EntitlementGrant,
  EntitlementKind,
  EntitlementOptions,
  EntitlementRegistration,
} from "#core/index";
import type { LimitGrant } from "#contracts/index";
import * as contracts from "#contracts/index";

describe("@stackra/entitlements", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entitlements).sort()).toEqual([
      "CatalogueChangeBackdatedError",
      "CatalogueVersionNotPendingError",
      "Entitlement",
      "EntitlementKind",
      "EntitlementSource",
      "EntitlementValueService",
      "LimitReachedError",
      "LimitReservationService",
      "MemoryCatalogueVersionsDriver",
      "MemoryPlanSnapshotsDriver",
      "MemorySeatLedgerDriver",
      "PlanCatalogueService",
      "PlanEntitlementCheckDriver",
      "PlanLimitReservationDriver",
      "PlanSnapshotEntitlementSourceDriver",
      "SeatLimitReachedError",
      "SeatMeterService",
      "SecondApproverRequiredError",
      "entitlementKey",
      "isEntitled",
      "isLimitGrant",
      "limitAllows",
      "limitOf",
      "paidPlanDays",
      "planCatalogueOf",
      "registerEntitlements",
      "tierPlan",
      "versionInForce",
    ]);
  });

  it("re-exports the contracts' EntitlementSource, so old imports name the same token", () => {
    expect(entitlements.EntitlementSource).toBe(contracts.EntitlementSource);
  });

  it("resolves its public types", () => {
    expectTypeOf<EntitlementGrant>().toEqualTypeOf<boolean | number | LimitGrant>();
    expectTypeOf<EntitlementOptions["kind"]>().toEqualTypeOf<EntitlementKind>();
    expectTypeOf<EntitlementOptions["counts"]>().toEqualTypeOf<(() => AnyClass) | undefined>();
    expectTypeOf<EntitlementRegistration["type"]>().toEqualTypeOf<EntitlementClass>();
    expectTypeOf<EntitlementRegistration["gates"]>().toEqualTypeOf<readonly AnyClass[]>();
    expectTypeOf<InstanceType<EntitlementClass>>().toEqualTypeOf<entitlements.Entitlement>();
  });
});
