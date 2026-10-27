/**
 * Stackra file contract:
 * Purpose: unit tests of the EDI envelope writers through `writeInterchange`: an X12 850 and an EDIFACT ORDERS read back
 *          to the same parties, control number, date, flag and segments; X12 pads ISA to its fixed width and puts the
 *          set in its functional group; EDIFACT escapes delimiters; X12 refuses a delimiter in a value and a long id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";
import { readInterchange } from "#core/edi/read-interchange.function";
import { writeInterchange } from "#core/edi/write-interchange.function";

const at = new Date("2026-10-28T09:30:00Z");

const x12: EdiInterchange = {
  syntax: "x12",
  sender: { qualifier: "ZZ", id: "FIGENTRA" },
  receiver: { qualifier: "ZZ", id: "ACMEFOODS" },
  control: "7",
  at,
  test: false,
  version: "00401",
  messages: [
    {
      code: "810",
      control: "0001",
      segments: [
        ["BIG", "20261028", "INV-9"],
        ["TDS", "7800"],
      ],
    },
  ],
};

const edifact: EdiInterchange = {
  syntax: "edifact",
  sender: { qualifier: "14", id: "6291041500213" },
  receiver: { qualifier: "14", id: "5012345678901" },
  control: "8",
  at,
  test: true,
  version: "D:96A:UN",
  messages: [
    {
      code: "INVOIC",
      control: "1",
      segments: [
        ["BGM", "380", "INV-9", "9"],
        ["FTX", "AAI", "", "", "It's 5+5: ten?"],
      ],
    },
  ],
};

describe("writeInterchange", () => {
  it("writes an X12 interchange that reads back", () => {
    const text = writeInterchange(x12);
    expect(text.indexOf("~")).toBe(105);
    expect(text).toContain("GS*IN*FIGENTRA*ACMEFOODS*20261028*0930*7*X*004010~");
    expect(text).toContain("SE*4*0001~");
    const read = readInterchange(text);
    expect(read).toMatchObject({
      sender: x12.sender,
      receiver: x12.receiver,
      control: "000000007",
      at,
      test: false,
    });
    expect(read.messages).toEqual([{ ...x12.messages[0], group: { code: "IN", control: "7" } }]);
  });

  it("writes an EDIFACT interchange that reads back, delimiters escaped", () => {
    const text = writeInterchange(edifact);
    expect(
      text.startsWith(
        "UNA:+.? '\nUNB+UNOC:3+6291041500213:14+5012345678901:14+261028:0930+8++++++1'",
      ),
    ).toBe(true);
    expect(text).toContain("FTX+AAI+++It?'s 5?+5?: ten??'");
    expect(readInterchange(text)).toEqual({
      ...edifact,
      messages: [{ ...edifact.messages[0], version: "D:96A:UN" }],
    });
  });

  it("refuses an X12 value holding a delimiter or an id over 15 characters", () => {
    for (const bad of [
      { ...x12, messages: [{ code: "810", control: "0001", segments: [["BIG", "a*b"]] }] },
      { ...x12, sender: { qualifier: "ZZ", id: "A".repeat(16) } },
      { ...x12, messages: [{ code: "999", control: "0001", segments: [] }] },
    ]) {
      let error: unknown;
      try {
        writeInterchange(bad);
      } catch (caught) {
        error = caught;
      }
      expect(isRefusal(error, MalformedEdiError)).toBe(true);
    }
  });
});
