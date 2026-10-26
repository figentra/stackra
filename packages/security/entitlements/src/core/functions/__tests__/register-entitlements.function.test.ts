/**
 * Stackra file contract:
 * Purpose: unit tests of `registerEntitlements`: a row is stored frozen under its entitlement class, a later row
 *          replaces it, and a row whose class is not an entitlement, whose key is empty or whose gate is not an action
 *          or a query is refused.
 * Boundary: test only; reads the internal registry to see what was stored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 20 and
 *                     22).
 */
import { Action, Query } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Entitlement } from "#core/bases/entitlement.base";
import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { registerEntitlements } from "#core/functions/register-entitlements.function";
import type { EntitlementClass } from "#core/types/entitlement-class.type";

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

class ExportReportAction extends Action({
  key: "report.export",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<void> {}
}

class ListReportsQuery extends Query({
  key: "report.list",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<readonly string[]> {
    return [];
  }
}

class NotAKind {}

describe("registerEntitlements", () => {
  beforeEach(() => ENTITLEMENT_REGISTRY.clear());

  it("stores each row frozen under its class", () => {
    const gates = [ExportReportAction, ListReportsQuery];
    registerEntitlements([{ type: ReportsEntitlement, key: "reports.reports", gates }]);
    const row = ENTITLEMENT_REGISTRY.get(ReportsEntitlement);
    expect(row).toEqual({ type: ReportsEntitlement, key: "reports.reports", gates });
    expect(Object.isFrozen(row)).toBe(true);
    expect(Object.isFrozen(row?.gates)).toBe(true);
    expect(row?.gates).not.toBe(gates);
  });

  it("replaces an earlier row for the same class", () => {
    registerEntitlements([{ type: ReportsEntitlement, key: "reports.reports", gates: [] }]);
    registerEntitlements([
      { type: ReportsEntitlement, key: "reports.reports", gates: [ExportReportAction] },
    ]);
    expect(ENTITLEMENT_REGISTRY.get(ReportsEntitlement)?.gates).toEqual([ExportReportAction]);
  });

  it("refuses a class that is not an entitlement", () => {
    const type = NotAKind as unknown as EntitlementClass;
    expect(() => registerEntitlements([{ type, key: "x.y", gates: [] }])).toThrow(
      /NotAKind is not an entitlement/,
    );
  });

  it("refuses an empty key", () => {
    expect(() => registerEntitlements([{ type: ReportsEntitlement, key: "", gates: [] }])).toThrow(
      /needs its locked key/,
    );
  });

  it("refuses a gate that is not an action or a query", () => {
    expect(() =>
      registerEntitlements([
        { type: ReportsEntitlement, key: "reports.reports", gates: [NotAKind] },
      ]),
    ).toThrow(/gates NotAKind, which is not an action or a query/);
    expect(ENTITLEMENT_REGISTRY.size).toBe(0);
  });
});
