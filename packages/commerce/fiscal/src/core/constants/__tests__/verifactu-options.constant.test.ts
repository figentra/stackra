/**
 * Stackra file contract:
 * Purpose: unit tests of `VERIFACTU_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { VERIFACTU_OPTIONS } from "#core/constants/verifactu-options.constant";

const SAMPLE = {
  submitUrl: "https://authority.test/records",
  qrUrl: "https://authority.test/qr",
  version: "1.0",
  namespaces: {
    envelope: "https://ns.test/envelope",
    submission: "https://ns.test/submission",
    information: "https://ns.test/information",
  },
  invoiceTypes: { invoice: "a", simplified: "b", credit_note: "c", debit_note: "d" },
  regimeKey: "01",
  qualifications: { S: "S1", E: "E1" },
  operationDescription: "Sales",
  system: {
    producerName: "Producer",
    producerTaxId: "TAX-P",
    name: "System",
    id: "SY",
    version: "1",
    onlyVerifactu: "S",
    multipleTaxpayers: "N",
    multipleTaxpayersInUse: "N",
  },
  timeZone: "UTC",
};

describe("VERIFACTU_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(VERIFACTU_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `namespaces`", () => {
    const { namespaces: _left, ...rest } = SAMPLE;
    expect(VERIFACTU_OPTIONS.safeParse(rest).success).toBe(false);
  });
});
