/**
 * Stackra file contract:
 * Purpose: unit tests of `functionalAcknowledgement`: a 997 for the recorded X12 850 (AK1 of its group, AK2 and AK5 `A`,
 *          AK9 `A`) and a CONTRL for the recorded EDIFACT ORDERS (UCI action 7), both addressed back to the sender and
 *          writable; an interchange of acknowledgements only gets none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import { describe, expect, it } from "@stackra/testing";

import { EDIFACT_ORDER } from "#core/edi/__tests__/edifact-order.constant";
import { X12_ORDER } from "#core/edi/__tests__/x12-order.constant";
import { functionalAcknowledgement } from "#core/edi/functional-acknowledgement.function";
import { readInterchange } from "#core/edi/read-interchange.function";
import { writeInterchange } from "#core/edi/write-interchange.function";

const at = new Date("2026-10-28T10:00:00Z");

/** `value`, failing the test when it is undefined. */
function present<T>(value: T | undefined): T {
  if (value === undefined) throw new TypeError("expected an acknowledgement");
  return value;
}

describe("functionalAcknowledgement", () => {
  it("answers an X12 850 with a 997", () => {
    const ack = functionalAcknowledgement(readInterchange(X12_ORDER), "5", at);
    expect(ack).toMatchObject({
      sender: { qualifier: "ZZ", id: "FIGENTRA" },
      receiver: { qualifier: "ZZ", id: "ACMEFOODS" },
      control: "5",
      test: true,
    });
    expect(ack?.messages).toEqual([
      {
        code: "997",
        control: "0001",
        segments: [
          ["AK1", "PO", "42"],
          ["AK2", "850", "0001"],
          ["AK5", "A"],
          ["AK9", "A", "1", "1", "1"],
        ],
      },
    ]);
    expect(readInterchange(writeInterchange(present(ack))).messages[0]?.group).toEqual({
      code: "FA",
      control: "5",
    });
  });

  it("answers an EDIFACT ORDERS with a CONTRL", () => {
    const ack = functionalAcknowledgement(readInterchange(EDIFACT_ORDER), "9", at);
    expect(ack?.messages).toEqual([
      {
        code: "CONTRL",
        control: "1",
        version: "D:3:UN",
        segments: [["UCI", "77", ["5012345678901", "14"], ["6291041500213", "14"], "7"]],
      },
    ]);
    expect(readInterchange(writeInterchange(present(ack))).messages[0]?.code).toBe("CONTRL");
  });

  it("never acknowledges an acknowledgement", () => {
    const ack = present(functionalAcknowledgement(readInterchange(X12_ORDER), "5", at));
    expect(functionalAcknowledgement(ack, "6", at)).toBeUndefined();
  });
});
