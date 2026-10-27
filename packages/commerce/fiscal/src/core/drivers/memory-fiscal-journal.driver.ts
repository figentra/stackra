/**
 * Stackra file contract:
 * Purpose: `MemoryFiscalJournalDriver`, an in-memory `FiscalJournal` for tests and development: the same append
 *          guards (one record per sequence and per document on a unit) as a durable journal, and the pending and
 *          submitted queues.
 * Boundary: the memory driver the port ships with (ADR 0266); its name is the file prefix (`memory`). Every check and
 *           write of `append` happens in one turn of the event loop, so two seals that race see each other.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3); ADR 0266 (decision 2).
 */
import { Driver } from "@stackra/container";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalJournal } from "#contracts/ports/fiscal-journal.port";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";

/**
 * Holds each unit's records in sequence order for the life of the instance.
 *
 * @example
 * const journal = new MemoryFiscalJournalDriver();
 */
export class MemoryFiscalJournalDriver extends Driver(FiscalJournal) {
  /** Records per unit, sorted by sequence. */
  private readonly units = new Map<string, FiscalRecord[]>();

  /** The unit's highest-sequence record. */
  async last(unitId: string): Promise<FiscalRecord | null> {
    return this.units.get(unitId)?.at(-1) ?? null;
  }

  /** The unit's record of a document. */
  async find(unitId: string, documentId: string): Promise<FiscalRecord | null> {
    return this.units.get(unitId)?.find((record) => record.documentId === documentId) ?? null;
  }

  /** Stores the record unless its sequence or document is taken; sequences must follow the tail. */
  async append(record: FiscalRecord): Promise<boolean> {
    const records = this.units.get(record.unitId) ?? [];
    const tail = records.at(-1)?.sequence ?? 0;
    if (
      record.sequence !== tail + 1 ||
      records.some((stored) => stored.documentId === record.documentId)
    )
      return false;
    records.push(record);
    this.units.set(record.unitId, records);
    return true;
  }

  /** Replaces the record with the same unit and sequence; an unknown one is ignored. */
  async update(record: FiscalRecord): Promise<void> {
    const records = this.units.get(record.unitId);
    const index = records?.findIndex((stored) => stored.sequence === record.sequence) ?? -1;
    if (records && index >= 0) records[index] = record;
  }

  /** The unit's sealed records, lowest sequence first. */
  async pending(unitId: string, limit: number): Promise<readonly FiscalRecord[]> {
    return (this.units.get(unitId) ?? [])
      .filter((record) => record.status === FiscalRecordStatus.Sealed)
      .slice(0, limit);
  }

  /** The unit's submitted records awaiting a verdict, lowest sequence first. */
  async submitted(unitId: string, limit: number): Promise<readonly FiscalRecord[]> {
    return (this.units.get(unitId) ?? [])
      .filter((record) => record.status === FiscalRecordStatus.Submitted)
      .slice(0, limit);
  }

  /** The unit's records sealed in `[from, to)`. */
  async range(unitId: string, from: Date, to: Date): Promise<readonly FiscalRecord[]> {
    return (this.units.get(unitId) ?? []).filter(
      (record) => record.sealedAt >= from && record.sealedAt < to,
    );
  }
}
