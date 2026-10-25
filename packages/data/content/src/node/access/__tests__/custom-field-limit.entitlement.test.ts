/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomFieldLimitEntitlement`: an entitlement of kind `limit` whose counted model is
 *          `CustomField`, declared without any gated call.
 * Boundary: test only; registers nothing, as the package registers no gate for it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0215 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { Entitlement, EntitlementKind } from "@stackra/entitlements";
import { describe, expect, it } from "@stackra/testing";

import { CustomFieldLimitEntitlement } from "#node/access/custom-field-limit.entitlement";
import { CustomField } from "#node/models/custom-field.model";

describe("CustomFieldLimitEntitlement", () => {
  it("is a limit entitlement counting CustomField", () => {
    const record = kindOf(CustomFieldLimitEntitlement);
    const options = record?.options ?? {};
    expect(record?.kind).toBe("entitlement");
    expect(options["kind"]).toBe(EntitlementKind.Limit);
    expect((options["counts"] as () => unknown)()).toBe(CustomField);
    expect(new CustomFieldLimitEntitlement()).toBeInstanceOf(Entitlement);
  });
});
