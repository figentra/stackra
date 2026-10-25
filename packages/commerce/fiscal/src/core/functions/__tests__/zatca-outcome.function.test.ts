/**
 * Stackra file contract:
 * Purpose: unit tests of `zatcaOutcome`: accepted, warned, duplicate, rejected and unreadable answers, and a cleared
 *          invoice replacing the payload.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { toBase64 } from "#core/functions/to-base64.function";
import { zatcaOutcome } from "#core/functions/zatca-outcome.function";

const answer = (status: number, body: unknown) => ({
  status,
  headers: {},
  body: typeof body === "string" ? body : JSON.stringify(body),
});

describe("zatcaOutcome", () => {
  it("accepts a 200 and decodes a cleared invoice", () => {
    expect(zatcaOutcome(answer(200, { clearedInvoice: toBase64("<Cleared></Cleared>") }))).toEqual({
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: "<Cleared></Cleared>",
    });
  });

  it("accepts a 202 with its warnings and a 409 duplicate", () => {
    const warned = zatcaOutcome(
      answer(202, { validationResults: { warningMessages: [{ message: "w1" }] } }),
    );
    expect([warned.status, warned.message]).toEqual([FiscalRecordStatus.Accepted, "w1"]);
    expect(zatcaOutcome(answer(409, {})).status).toBe(FiscalRecordStatus.Accepted);
  });

  it("rejects a 400 with every error", () => {
    const errors = [{ message: "e1" }, { message: "e2" }];
    const outcome = zatcaOutcome(answer(400, { validationResults: { errorMessages: errors } }));
    expect([outcome.status, outcome.message]).toEqual([FiscalRecordStatus.Rejected, "e1; e2"]);
  });

  it("reads an unreadable body as no details", () => {
    expect(zatcaOutcome(answer(400, "<html>"))).toEqual({
      status: FiscalRecordStatus.Rejected,
      authorityReference: null,
      message: "HTTP 400",
      payload: null,
    });
  });
});
