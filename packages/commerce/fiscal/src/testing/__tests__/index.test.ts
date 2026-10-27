/**
 * Stackra file contract:
 * Purpose: unit tests of `@stackra/fiscal/testing`: the entry exports exactly the fakes, fixtures and the
 *          certification harness.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/fiscal/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "FiscalDeviceFake",
      "FiscalPackSourceFake",
      "FiscalSignerFake",
      "FiscalSigningKeyFake",
      "FiscalTransportFake",
      "HybridPdfFake",
      "TillCredentialsFake",
      "TurnoverCipherFake",
      "certificationCases",
      "fiscalDocument",
      "fiscalRecord",
      "runCertification",
    ]);
  });
});
