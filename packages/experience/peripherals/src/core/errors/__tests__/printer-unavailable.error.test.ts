/**
 * Stackra file contract:
 * Purpose: unit tests of `PrinterUnavailableError`: kind `unavailable`, code `printer_unavailable`, retryable, and
 *          the printer's reason is its only detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";

describe("PrinterUnavailableError", () => {
  it("is a retryable unavailable refusal with the reason", () => {
    const error = PrinterUnavailableError.create({ reason: "unavailable" });
    expect(isRefusal(error, PrinterUnavailableError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.code).toBe("printer_unavailable");
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ reason: "unavailable" });
  });

  it("has the envelope of ADR 0140", () => {
    expect(PrinterUnavailableError.envelope({ reason: "permission_denied" })).toEqual({
      code: "printer_unavailable",
      category: "unavailable",
      retryable: true,
      details: { reason: "permission_denied" },
    });
  });
});
