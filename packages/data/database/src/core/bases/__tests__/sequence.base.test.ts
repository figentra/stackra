/**
 * Stackra file contract:
 * Purpose: unit tests of `Sequence`: the called form records its options with the defaults filled in, keeps
 *          `instanceof`, and refuses a bad key, a bad or repeated dimension, a format without the number or with an
 *          unknown token, `{year}` on a sequence that never resets (and a yearly one without it), an unknown reset and
 *          a bad reservation size.
 * Boundary: test only; reads the kind registry through `kindOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decisions 1 and 4); ADR 0294 (decision 25); ADR 0022; ADR 0269.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Sequence } from "#core/bases/sequence.base";
import type { SequenceOptions } from "#core/types/sequence-options.type";

class InvoiceSequence extends Sequence({
  key: "invoice",
  series: ["legalEntityId", "locationId"],
  format: "INV-{year}-{n:06}",
  reset: "yearly",
  reserve: { size: 50 },
}) {}

class ReceiptSequence extends Sequence({ key: "receipt" }) {}

/** A declaration of an invoice sequence with `options` over the defaults, to run later. */
function bad(options: Partial<SequenceOptions>) {
  return () => Sequence({ key: "invoice", ...options } as SequenceOptions);
}

describe("Sequence", () => {
  it("records its options, with the defaults filled in", () => {
    expect(kindOf(InvoiceSequence)).toEqual({
      kind: "sequence",
      options: {
        key: "invoice",
        series: ["legalEntityId", "locationId"],
        format: "INV-{year}-{n:06}",
        reset: "yearly",
        reserve: { size: 50 },
      },
    });
    expect(kindOf(ReceiptSequence)?.options).toEqual({
      key: "receipt",
      series: [],
      format: "{n}",
      reset: "never",
      reserve: false,
    });
    expect(new ReceiptSequence()).toBeInstanceOf(ReceiptSequence);
  });

  it("refuses bad options", () => {
    expect(bad({ key: "Invoice" })).toThrow(/snake_case/);
    expect(bad({ series: ["legal_entity"] })).toThrow(/camelCase/);
    expect(bad({ series: ["locationId", "locationId"] })).toThrow(/named twice/);
    expect(bad({ format: "INV-" })).toThrow(/has the number/);
    expect(bad({ format: "INV-{month}-{n}" })).toThrow(/not a sequence format token/);
    expect(bad({ format: "INV-{year}-{n}" })).toThrow(/goes with reset "yearly"/);
    expect(bad({ reset: "yearly" })).toThrow(/goes with reset "yearly"/);
    expect(bad({ reset: "monthly" as never })).toThrow(/"never" or "yearly"/);
    expect(bad({ reserve: { size: 0 } })).toThrow(/size from 1/);
    expect(bad({ reserve: { size: 10_001 } })).toThrow(/size from 1/);
  });
});
