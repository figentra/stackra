/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPaymentRecordsDriver`: an unknown reference is null, and a save replaces the record
 *          under its reference.
 * Boundary: test only; the driver is constructed directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { PaymentRecord } from "#contracts/types/payment-record.type";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";

const record: PaymentRecord = {
  reference: "ord_1",
  provider: "fake",
  connectionId: "conn_1",
  amount: Money.ofMinor(1_000, "SAR"),
  refunded: Money.zero("SAR"),
  status: PaymentStatus.Pending,
  updatedAt: new Date("2026-10-25T00:00:00Z"),
};

describe("MemoryPaymentRecordsDriver", () => {
  it("finds what it saved and replaces by reference", async () => {
    const records = new MemoryPaymentRecordsDriver();
    expect(records).toBeInstanceOf(PaymentRecords);
    expect(await records.find("ord_1")).toBeNull();
    await records.save(record);
    await records.save({ ...record, status: PaymentStatus.Captured });
    expect((await records.find("ord_1"))?.status).toBe(PaymentStatus.Captured);
  });
});
