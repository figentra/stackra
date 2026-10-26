/**
 * Stackra file contract:
 * Purpose: unit tests of `EntitlementValueService`: it reads a value entitlement's number from the source in the given
 *          scope, answers `undefined` outside the plan, and throws a `TypeError` for a class of another kind or a
 *          source answer that is not a number.
 * Boundary: test only; the source is `fakeEntitlements`, wrapped to record the scope it was asked for.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0408; STA-824.
 */
import type { PublicId } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { registerEntitlements } from "#core/functions/register-entitlements.function";
import { EntitlementValueService } from "#core/services/entitlement-value.service";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementGrant } from "#core/types/entitlement-grant.type";
import { fakeEntitlements } from "#testing/functions/fake-entitlements.function";

class AuditWindowDaysEntitlement extends Entitlement({ kind: EntitlementKind.Value }) {}

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId;

/** A plan granting `grants`, recording each scope asked for. */
function planOf(grants: readonly (readonly [EntitlementClass, EntitlementGrant])[]) {
  const fake = fakeEntitlements(grants);
  const scopes: (PublicId | undefined)[] = [];
  const source = Object.assign(Object.create(EntitlementSource.prototype) as EntitlementSource, {
    grant: (entitlement: EntitlementClass, scope: PublicId | undefined) => {
      scopes.push(scope);
      return fake.grant(entitlement, scope);
    },
  });
  return { source, scopes };
}

describe(EntitlementValueService, () => {
  beforeEach(() => {
    ENTITLEMENT_REGISTRY.clear();
    registerEntitlements([
      { type: AuditWindowDaysEntitlement, key: "audit.window_days", gates: [] },
      { type: ReportsEntitlement, key: "reports.reports", gates: [] },
    ]);
  });

  it("reads the number the scope's plan sets", async () => {
    const { source, scopes } = planOf([[AuditWindowDaysEntitlement, 90]]);
    const values = new EntitlementValueService(source);
    expect(await values.valueOf(AuditWindowDaysEntitlement, ACME)).toBe(90);
    expect(scopes).toEqual([ACME]);
  });

  it("answers undefined outside the plan", async () => {
    const { source } = planOf([]);
    const values = new EntitlementValueService(source);
    expect(await values.valueOf(AuditWindowDaysEntitlement, ACME)).toBeUndefined();
  });

  it("throws for another kind and for a grant that is not a number", async () => {
    const { source } = planOf([
      [AuditWindowDaysEntitlement, { limit: 3 }],
      [ReportsEntitlement, true],
    ]);
    const values = new EntitlementValueService(source);
    await expect(values.valueOf(ReportsEntitlement, ACME)).rejects.toThrow(TypeError);
    await expect(values.valueOf(AuditWindowDaysEntitlement, ACME)).rejects.toThrow(TypeError);
  });
});
