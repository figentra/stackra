/**
 * Stackra file contract:
 * Purpose: type tests of `SealedPayload`: a driver output with a status code.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";

describe("SealedPayload", () => {
  it("takes an unsigned payload and refuses one without a status", () => {
    const sealed: SealedPayload = {
      payload: "<x></x>",
      contentType: "application/xml",
      hash: "h",
      signature: null,
      qr: null,
      marks: {},
      status: FiscalRecordStatus.Sealed,
    };
    // @ts-expect-error -- the driver says whether a submission follows
    const statusless: SealedPayload = { ...sealed, status: undefined };
    expect([sealed.status, statusless.hash]).toEqual(["sealed", "h"]);
  });
});
