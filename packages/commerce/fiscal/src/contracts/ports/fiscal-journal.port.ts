/**
 * Stackra file contract:
 * Purpose: `FiscalJournal`, the port of the per-unit store of sealed records: the chain's tail, a document's record,
 *          the pending queue, the records awaiting the authority's verdict, and a date range.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalJournal`. `append` is atomic on
 *           (unit, sequence) and on (unit, document): a driver for a till keeps it on the device, a server keeps it in
 *           its database. The memory driver ships here. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 3 and 7); ADR 0266 (decision 2: a memory driver ships with the port).
 */
import { Port } from "@stackra/contracts";

import type { FiscalRecord } from "#contracts/types/fiscal-record.type";

/**
 * Holds every unit's chain; records are never deleted while the pack's retention runs.
 *
 * @example
 * const last = await journal.last("till_1");
 */
export abstract class FiscalJournal extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalJournal";

  /** The unit's record with the highest sequence; `null` for a new unit. */
  abstract last(unitId: string): Promise<FiscalRecord | null>;

  /** The unit's record of a document; `null` when it was never sealed. */
  abstract find(unitId: string, documentId: string): Promise<FiscalRecord | null>;

  /** Stores a new record; false and no change when its sequence or document is already taken on the unit. */
  abstract append(record: FiscalRecord): Promise<boolean>;

  /** Replaces the stored record with the same unit and sequence (a submission's answer). */
  abstract update(record: FiscalRecord): Promise<void>;

  /** Up to `limit` of the unit's `sealed` records, lowest sequence first. */
  abstract pending(unitId: string, limit: number): Promise<readonly FiscalRecord[]>;

  /**
   * Up to `limit` of the unit's `submitted` records (handed over, verdict pending), lowest sequence first; what
   * `FiscalService.pollSubmitted` asks the authority about.
   */
  abstract submitted(unitId: string, limit: number): Promise<readonly FiscalRecord[]>;

  /** The unit's records sealed in `[from, to)`, lowest sequence first. */
  abstract range(unitId: string, from: Date, to: Date): Promise<readonly FiscalRecord[]>;
}
