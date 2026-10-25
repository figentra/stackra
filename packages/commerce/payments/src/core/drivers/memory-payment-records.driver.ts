/**
 * Stackra file contract:
 * Purpose: `MemoryPaymentRecordsDriver`, an in-memory `PaymentRecords` for tests and development: one record per
 *          reference, replaced on save.
 * Boundary: the memory driver every port ships before its durable one (ADR 0266); its name is the file prefix
 *           (`memory`). Isomorphic, so it ships from the `.` entry. Records live for the life of the container.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0266 (decision 2).
 */
import { Driver } from "@stackra/container";

import { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { PaymentRecord } from "#contracts/types/payment-record.type";

/**
 * Records in a Map.
 *
 * @example
 * const records = new MemoryPaymentRecordsDriver();
 * await records.save(record);
 */
export class MemoryPaymentRecordsDriver extends Driver(PaymentRecords) {
  /** Records by reference. */
  private readonly records = new Map<string, PaymentRecord>();

  async find(reference: string): Promise<PaymentRecord | null> {
    return this.records.get(reference) ?? null;
  }

  async save(record: PaymentRecord): Promise<void> {
    this.records.set(record.reference, record);
  }
}
