/**
 * Stackra file contract:
 * Purpose: unit tests of `moduleDependsOn`: the sibling modules whose `#`-imported classes a module's classes take,
 *          sorted, never the module itself nor a package class.
 * Boundary: test only; the IR is built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 24).
 */
import { describe, expect, it } from "@stackra/testing";

import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { moduleDependsOn } from "#core/functions/module-depends-on.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A class of `module` taking the named classes, each from `from`. */
const declared = (
  name: string,
  module: string,
  deps: readonly { name: string; from: string }[] = [],
): DeclaredClass =>
  ({ name, module, deps: deps.map((dep) => ({ class: dep })) }) as unknown as DeclaredClass;

const ir: MemberIR = {
  ...LOYALTY_KIT_IR,
  classes: [
    declared("InvoiceService", "billing", [
      { name: "TenantService", from: "#modules/tenants/services/tenant.service" },
      { name: "InvoiceRepo", from: "#modules/billing/services/invoice-repo.service" },
      { name: "Clock", from: "@stackra/support" },
    ]),
    declared("TenantService", "tenants"),
    declared("InvoiceRepo", "billing"),
  ],
};

describe("moduleDependsOn", () => {
  it("lists the sibling modules a module's classes take", () => {
    expect(moduleDependsOn(ir, "billing")).toEqual(["tenants"]);
  });

  it("is empty for a module that takes nothing from a sibling", () => {
    expect(moduleDependsOn(ir, "tenants")).toEqual([]);
  });
});
