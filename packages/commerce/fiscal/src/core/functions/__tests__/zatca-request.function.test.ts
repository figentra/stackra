/**
 * Stackra file contract:
 * Purpose: unit tests of `zatcaRequest`: the hash, UUID and base64 invoice in the body, the version header, and the
 *          clearance switch.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { fromBase64 } from "#core/functions/from-base64.function";
import { zatcaRequest } from "#core/functions/zatca-request.function";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

describe("zatcaRequest", () => {
  it("posts the record with the unit's credential", () => {
    const request = zatcaRequest(fiscalRecord(), "https://report.test", "V2", false);
    const body = JSON.parse(request.body ?? "");
    expect([request.method, request.url, request.credential]).toEqual([
      "POST",
      "https://report.test",
      "till_1",
    ]);
    expect(request.headers["Accept-Version"]).toBe("V2");
    expect(request.headers["Clearance-Status"]).toBeUndefined();
    expect([body.invoiceHash, body.uuid]).toEqual(["hash-1", "doc_1"]);
    expect(new TextDecoder().decode(fromBase64(body.invoice))).toBe("<Invoice></Invoice>");
  });

  it("asks for clearance when told to", () => {
    expect(
      zatcaRequest(fiscalRecord(), "https://clear.test", "V2", true).headers["Clearance-Status"],
    ).toBe("1");
  });
});
