/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentRecords`: an abstract port a host class can implement, keyed by the merchant's
 *          reference.
 * Boundary: test only; a minimal host store stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { PaymentRecord } from "#contracts/types/payment-record.type";

/** A store of the kind a host writes for a test: it holds nothing. */
class EmptyRecords extends PaymentRecords {
  async find(): Promise<null> {
    return null;
  }

  async save(): Promise<void> {}
}

describe("PaymentRecords", () => {
  it("is an abstract port a host class implements", async () => {
    const records = new EmptyRecords();
    expect(records).toBeInstanceOf(Port);
    expect(await records.find()).toBeNull();
  });

  it("finds by reference and saves a record", () => {
    expectTypeOf<Parameters<PaymentRecords["find"]>[0]>().toEqualTypeOf<string>();
    expectTypeOf<Parameters<PaymentRecords["save"]>[0]>().toEqualTypeOf<PaymentRecord>();
  });
});
