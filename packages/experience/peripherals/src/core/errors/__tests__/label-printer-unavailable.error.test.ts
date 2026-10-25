/**
 * Stackra file contract:
 * Purpose: unit tests of `LabelPrinterUnavailableError`: a retryable `unavailable` refusal coded
 *          `label_printer_unavailable` that carries only why the printer refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0250 (decision 3).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LabelPrinterUnavailableError } from "#core/errors/label-printer-unavailable.error";

describe("LabelPrinterUnavailableError", () => {
  it("is a retryable unavailable refusal with the reason", () => {
    const error = LabelPrinterUnavailableError.create({ reason: "unavailable" });
    expect(isRefusal(error, LabelPrinterUnavailableError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.code).toBe("label_printer_unavailable");
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ reason: "unavailable" });
  });
});
