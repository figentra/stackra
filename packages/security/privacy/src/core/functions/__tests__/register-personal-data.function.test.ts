/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPersonalData` and `personalDataDeclarations`: registration keeps order and one
 *          entry per class, refuses a class of another kind and a module key that is not snake_case, and resolves each
 *          declaration's model, model key and fields.
 * Boundary: test only; clears the registry after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Address } from "#core/__tests__/address.fixture";
import { AddressPersonalData } from "#core/__tests__/address-personal-data.fixture";
import { Customer } from "#core/__tests__/customer.fixture";
import { CustomerPersonalData } from "#core/__tests__/customer-personal-data.fixture";
import type { PersonalDataClass } from "#core/types/personal-data-class.type";
import { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { clearPersonalData } from "#testing/clear-personal-data.function";

afterEach(() => clearPersonalData());

describe("registerPersonalData", () => {
  it("registers in order, once per class, and resolves each declaration", () => {
    registerPersonalData("crm", [CustomerPersonalData, AddressPersonalData, CustomerPersonalData]);
    expect(personalDataDeclarations()).toEqual([
      {
        kind: "crm.customer",
        model: Customer,
        subject: "userId",
        fields: { name: "shred", phone: "anonymise" },
      },
      { kind: "crm.address", model: Address, subject: "userId", fields: { line: "delete" } },
    ]);
  });

  it("refuses a class that is not a declaration", () => {
    class NotADeclaration {}
    expect(() =>
      registerPersonalData("crm", [NotADeclaration as unknown as PersonalDataClass]),
    ).toThrow(TypeError);
    expect(personalDataDeclarations()).toEqual([]);
  });

  it("refuses a module key that is not snake_case", () => {
    expect(() => registerPersonalData("Crm.x", [CustomerPersonalData])).toThrow(TypeError);
    expect(personalDataDeclarations()).toEqual([]);
  });
});
