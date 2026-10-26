/**
 * Stackra file contract:
 * Purpose: unit tests of `@DocumentNumber`: a marked field records its sequence, a subclass inherits it, a bad
 *          sequence key and a non-model target are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0342 (decisions 1 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { DocumentNumber } from "#core/decorators/document-number.decorator";

class Invoice extends Model {
  @DocumentNumber({ sequence: "invoice" })
  number: string | null = null;

  total = 0;
}

class CreditNote extends Invoice {}

describe(DocumentNumber, () => {
  it("records the sequence of each document-number field, inherited", () => {
    expect([...DocumentNumber.members(CreditNote)]).toEqual([["number", { sequence: "invoice" }]]);
  });

  it("takes a module-qualified sequence key", () => {
    expect(() => DocumentNumber({ sequence: "billing.invoice" })).not.toThrow();
  });

  it.each(["Invoice", "billing.invoice.extra", "", "inv-oice"])(
    "refuses the key %j",
    (sequence) => {
      expect(() => DocumentNumber({ sequence })).toThrow(TypeError);
    },
  );

  it("marks model fields only", () => {
    expect(() => {
      class NotAModel {
        @DocumentNumber({ sequence: "invoice" })
        number = "";
      }
      return NotAModel;
    }).toThrow(TypeError);
  });
});
