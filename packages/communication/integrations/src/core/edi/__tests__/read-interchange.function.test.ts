/**
 * Stackra file contract:
 * Purpose: unit tests of the EDI envelope readers through `readInterchange`: the recorded X12 850 and EDIFACT ORDERS
 *          fixtures read into parties, control numbers, dates, test flags, groups and body segments (escapes undone);
 *          a broken count, control number, header or trailer is refused with `MalformedEdiError`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { EDIFACT_ORDER } from "#core/edi/__tests__/edifact-order.constant";
import { X12_ORDER } from "#core/edi/__tests__/x12-order.constant";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";
import { readInterchange } from "#core/edi/read-interchange.function";

/** The refusal `read` throws. */
function refusalOf(read: () => unknown): unknown {
  try {
    read();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("readInterchange", () => {
  it("reads the recorded X12 850", () => {
    expect(readInterchange(X12_ORDER)).toEqual({
      syntax: "x12",
      sender: { qualifier: "ZZ", id: "ACMEFOODS" },
      receiver: { qualifier: "ZZ", id: "FIGENTRA" },
      control: "000000042",
      at: new Date("2026-10-28T09:30:00Z"),
      test: true,
      version: "00401",
      messages: [
        {
          code: "850",
          control: "0001",
          group: { code: "PO", control: "42" },
          segments: [
            ["BEG", "00", "SA", "PO-7781", "", "20261028"],
            ["PO1", "1", "24", "EA", "3.25", "", "VN", "SKU-1"],
            ["CTT", "1"],
          ],
        },
      ],
    });
  });

  it("reads the recorded EDIFACT ORDERS and undoes the release character", () => {
    expect(readInterchange(EDIFACT_ORDER)).toEqual({
      syntax: "edifact",
      sender: { qualifier: "14", id: "5012345678901" },
      receiver: { qualifier: "14", id: "6291041500213" },
      control: "77",
      at: new Date("2026-10-28T09:30:00Z"),
      test: true,
      version: "D:96A:UN",
      messages: [
        {
          code: "ORDERS",
          control: "1",
          version: "D:96A:UN",
          segments: [
            ["BGM", "220", "PO-7782", "9"],
            ["NAD", "BY", ["5012345678901", "", "9"]],
            ["FTX", "AAI", "", "", "Fragile: handle with care"],
          ],
        },
      ],
    });
  });

  it("refuses a wrong trailer count or control number", () => {
    for (const text of [
      X12_ORDER.replace("SE*5*0001", "SE*4*0001"),
      X12_ORDER.replace("IEA*1*000000042", "IEA*1*000000043"),
      EDIFACT_ORDER.replace("UNT+5+1", "UNT+6+1"),
      EDIFACT_ORDER.replace("UNZ+1+77", "UNZ+1+78"),
    ]) {
      const error = refusalOf(() => readInterchange(text));
      expect(isRefusal(error, MalformedEdiError)).toBe(true);
    }
  });

  it("refuses text with no header or no trailer", () => {
    expect(
      isRefusal(
        refusalOf(() => readInterchange("hello")),
        MalformedEdiError,
      ),
    ).toBe(true);
    expect(
      isRefusal(
        refusalOf(() => readInterchange(X12_ORDER.replace(/IEA[^~]*~/, ""))),
        MalformedEdiError,
      ),
    ).toBe(true);
    expect(
      isRefusal(
        refusalOf(() => readInterchange(EDIFACT_ORDER.replace(/UNZ[^']*'/, ""))),
        MalformedEdiError,
      ),
    ).toBe(true);
  });
});
