/**
 * Stackra file contract:
 * Purpose: unit tests of the `PersonalData` kind: a called form that records its options in the kind registry and
 *          refuses a missing model thunk, an empty subject, no fields, or an unknown erasure method.
 * Boundary: test only; no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 25); STA-1375.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import type { ErasureMethod as Method } from "#contracts/enums/erasure-method.enum";
import { PersonalData } from "#core/bases/personal-data.base";
import { Customer } from "#core/__tests__/customer.fixture";
import { CustomerPersonalData } from "#core/__tests__/customer-personal-data.fixture";

describe("PersonalData", () => {
  it("records its options under the personal_data kind", () => {
    const record = kindOf(CustomerPersonalData);
    if (record === undefined) throw new Error("CustomerPersonalData is not a kind");
    expect(record.kind).toBe("personal_data");
    expect((record.options["model"] as () => unknown)()).toBe(Customer);
    expect(record.options["subject"]).toBe("userId");
    expect(record.options["fields"]).toEqual({ name: "shred", phone: "anonymise" });
    expect(Object.isFrozen(record.options["fields"])).toBe(true);
  });

  it("refuses a model that is not a thunk", () => {
    expect(() =>
      PersonalData({ model: "Customer" as never, subject: "userId", fields: { name: "shred" } }),
    ).toThrow(TypeError);
  });

  it("refuses an empty subject and an empty field list", () => {
    expect(() =>
      PersonalData({ model: () => Customer, subject: "", fields: { name: "shred" } }),
    ).toThrow(TypeError);
    expect(() => PersonalData({ model: () => Customer, subject: "userId", fields: {} })).toThrow(
      TypeError,
    );
  });

  it("refuses a method outside ErasureMethod", () => {
    expect(() =>
      PersonalData({
        model: () => Customer,
        subject: "userId",
        fields: { name: "burn" as Method },
      }),
    ).toThrow(RangeError);
  });
});
