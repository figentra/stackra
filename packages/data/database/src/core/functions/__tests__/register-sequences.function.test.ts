/**
 * Stackra file contract:
 * Purpose: unit tests of `registerSequences`: a row records the locked key, a later row for the same class replaces
 *          it, and a class that is not a sequence, a key that is not `<module>.<key>` or a key another class has is
 *          refused.
 * Boundary: test only; reads the internal registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decisions 1 and 5); ADR 0294 (decision 20); ADR 0022; ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Sequence } from "#core/bases/sequence.base";
import { SEQUENCE_REGISTRY } from "#core/constants/sequence-registry.constant";
import { registerSequences } from "#core/functions/register-sequences.function";
import type { SequenceClass } from "#core/types/sequence-class.type";

class InvoiceSequence extends Sequence({ key: "invoice" }) {}

class CreditNoteSequence extends Sequence({ key: "credit_note" }) {}

class NotASequence {}

afterEach(() => {
  SEQUENCE_REGISTRY.clear();
});

describe(registerSequences, () => {
  it("records and replaces the locked key", () => {
    registerSequences([{ type: InvoiceSequence, key: "billing.invoice" }]);
    expect(SEQUENCE_REGISTRY.get(InvoiceSequence)?.key).toBe("billing.invoice");
    registerSequences([{ type: InvoiceSequence, key: "invoicing.invoice" }]);
    expect(SEQUENCE_REGISTRY.get(InvoiceSequence)?.key).toBe("invoicing.invoice");
  });

  it("refuses a class that is not a sequence, a bad key and a shared key", () => {
    expect(() =>
      registerSequences([{ type: NotASequence as unknown as SequenceClass, key: "billing.x" }]),
    ).toThrow(/is not a sequence/);
    expect(() => registerSequences([{ type: InvoiceSequence, key: "invoice" }])).toThrow(
      /needs its locked key/,
    );
    registerSequences([{ type: InvoiceSequence, key: "billing.invoice" }]);
    expect(() => registerSequences([{ type: CreditNoteSequence, key: "billing.invoice" }])).toThrow(
      /both have the key billing.invoice/,
    );
  });
});
