/**
 * Stackra file contract:
 * Purpose: unit tests of `etaVerdict`: valid is accepted, invalid is rejected, a pending or unreadable answer is no
 *          verdict, and the receipt answer's nested status is read too.
 * Boundary: test only; the answers are samples, not captured authority responses.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { etaVerdict } from "#core/functions/eta-verdict.function";

const answer = (body: string) => ({ status: 200, headers: {}, body });

describe("etaVerdict", () => {
  it("reads valid as accepted and invalid as rejected", () => {
    expect(etaVerdict(answer('{"status":"Valid"}'), "U1")).toEqual({
      status: FiscalRecordStatus.Accepted,
      authorityReference: "U1",
      message: null,
      payload: null,
    });
    expect(etaVerdict(answer('{"receipt":{"status":"Invalid"}}'), "U1")?.status).toBe(
      FiscalRecordStatus.Rejected,
    );
  });

  it("gives no verdict while submitted or when the answer cannot be read", () => {
    expect(etaVerdict(answer('{"status":"Submitted"}'), "U1")).toBeNull();
    expect(etaVerdict(answer("not json"), "U1")).toBeNull();
  });
});
