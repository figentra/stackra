/**
 * Stackra file contract:
 * Purpose: unit tests of `BelongsToTenant`: the `tenantId` field exists unset on a created row (the unit of work
 *          fills it) and the trait is registered.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0239.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { BelongsToTenant } from "#core/traits/belongs-to-tenant.trait";

class Message extends Model.with(BelongsToTenant) {}

describe("BelongsToTenant", () => {
  it("adds an unset tenantId", () => {
    const message = new Message();
    expect(Object.keys(message)).toContain("tenantId");
    expect(message.tenantId).toBeUndefined();
  });

  it("is registered", () => {
    expect(BelongsToTenant.traitName).toBe("belongs_to_tenant");
    expect(traitsOf(Message).map((trait) => trait.name)).toEqual(["belongs_to_tenant"]);
  });
});
