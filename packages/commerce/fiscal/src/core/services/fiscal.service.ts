/**
 * Stackra file contract:
 * Purpose: `FiscalService`, the engine: it reads the market pack for a document's market and channel, picks the
 *          driver the pack names, seals the document onto the unit's chain (offline-capable, idempotent per
 *          document), submits pending records in order when the authority is reachable, reports how far a unit is
 *          behind against the pack's reporting window, and exports the journal.
 * Boundary: a `Service` the host builds with every driver it registers, because the driver is chosen per call from
 *           pack data rather than bound once. It names no market and holds no value of its own: windows and options
 *           are pack data, the time is the `Clock`'s. A pack with no mandate in a channel means nothing is sealed.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2, 3 and 7); ADR 0363 (decisions 3 and 4).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import type { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalJournal } from "#contracts/ports/fiscal-journal.port";
import type { FiscalPackSource } from "#contracts/ports/fiscal-pack-source.port";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalMandate } from "#contracts/types/fiscal-mandate.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { FiscalTarget } from "#contracts/types/fiscal-target.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { OfflineStatus } from "#contracts/types/offline-status.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalChainConflictError } from "#core/errors/fiscal-chain-conflict.error";
import { FiscalDriverMissingError } from "#core/errors/fiscal-driver-missing.error";

/** Milliseconds in an hour. */
const HOUR = 3_600_000;

/**
 * Seals, submits and exports fiscal records for any market a pack covers.
 *
 * @example
 * const fiscal = new FiscalService([new ZatcaDriver(signer, transport), new TseDriver(device)], packs, journal, clock);
 * const record = await fiscal.seal(document, { market: "sa", channel: FiscalChannel.Till, unitId: "till_1" });
 */
export class FiscalService extends Service {
  /** Registered drivers by key. */
  private readonly drivers: ReadonlyMap<string, FiscalDriver>;

  /** Reads the pack's fiscal section. */
  private readonly packs: FiscalPackSource;

  /** Holds every unit's chain. */
  private readonly journal: FiscalJournal;

  /** Tells the time. */
  private readonly clock: Clock;

  /**
   * @param drivers - every driver the host offers; a later one with the same key replaces an earlier one.
   * @param packs - the market-pack source.
   * @param journal - the journal.
   * @param clock - the clock.
   */
  constructor(
    drivers: readonly FiscalDriver[],
    packs: FiscalPackSource,
    journal: FiscalJournal,
    clock: Clock,
  ) {
    super();
    this.drivers = new Map(drivers.map((driver) => [driver.key, driver]));
    this.packs = packs;
    this.journal = journal;
    this.clock = clock;
  }

  /**
   * Seals the document under the pack in force on its issue date. Sealing the same document on the same unit again
   * returns the stored record, so a retry never signs twice.
   *
   * @returns the record, or `null` when the market's pack asks nothing in this channel.
   * @throws FiscalDriverMissingError when the pack names a driver that is not registered.
   * @throws FiscalChainConflictError when another seal took the chain position first; seal again.
   */
  async seal(document: FiscalDocument, target: FiscalTarget): Promise<FiscalRecord | null> {
    const existing = await this.journal.find(target.unitId, document.id);
    if (existing) return existing;
    const mandate = await this.mandate(target, document.issuedAt);
    if (!mandate) return null;
    const driver = this.driver(target, mandate.driver);
    const previous = await this.journal.last(target.unitId);
    const sequence = (previous?.sequence ?? 0) + 1;
    const now = this.clock.now();
    const sealed = await driver.seal(document, {
      unitId: target.unitId,
      options: mandate.options,
      previous,
      sequence,
      now,
    });
    const record: FiscalRecord = {
      unitId: target.unitId,
      sequence,
      market: target.market,
      channel: target.channel,
      driver: driver.key,
      documentId: document.id,
      documentNumber: document.number,
      payload: sealed.payload,
      contentType: sealed.contentType,
      hash: sealed.hash,
      previousHash: previous?.hash ?? null,
      signature: sealed.signature,
      qr: sealed.qr,
      marks: sealed.marks,
      sealedAt: now,
      status: sealed.status,
      submittedAt: null,
      authorityReference: null,
      message: null,
    };
    if (!(await this.journal.append(record)))
      throw FiscalChainConflictError.create({ unitId: target.unitId, sequence });
    return record;
  }

  /**
   * Submits up to `limit` sealed records of the unit, lowest sequence first, under the pack in force when each was
   * sealed. Stops at the first record the authority does not take, so order is kept and the rest wait.
   *
   * @returns the records that got an answer, as updated in the journal.
   * @throws FiscalDriverMissingError when a record's driver is no longer registered.
   */
  async submitPending(target: FiscalTarget, limit: number): Promise<FiscalRecord[]> {
    const answered: FiscalRecord[] = [];
    for (const record of await this.journal.pending(target.unitId, limit)) {
      const mandate = await this.mandate(
        { ...target, market: record.market, channel: record.channel },
        record.sealedAt,
      );
      const driver = this.driver(target, record.driver);
      let outcome: SubmissionOutcome;
      try {
        outcome = await driver.submit(record, {
          unitId: target.unitId,
          options: mandate?.options ?? {},
        });
      } catch (error) {
        if (error instanceof FiscalAuthorityUnavailableError) break;
        throw error;
      }
      const updated: FiscalRecord = {
        ...record,
        status: outcome.status,
        authorityReference: outcome.authorityReference,
        message: outcome.message,
        payload: outcome.payload ?? record.payload,
        submittedAt: this.clock.now(),
      };
      await this.journal.update(updated);
      answered.push(updated);
    }
    return answered;
  }

  /**
   * How far the unit is behind: the sealed records, the oldest one's time and the deadline the pack's reporting
   * window sets for it today.
   */
  async offlineStatus(target: FiscalTarget): Promise<OfflineStatus> {
    const now = this.clock.now();
    // shortcut: reads the whole backlog to count it; a till's backlog is hours of receipts. Add a count to the port if
    // a server unit ever queues more.
    const pending = await this.journal.pending(target.unitId, Number.MAX_SAFE_INTEGER);
    const oldest = pending[0] ?? null;
    const window = (await this.mandate(target, now))?.reportingWindowHours ?? null;
    const deadline =
      oldest && window !== null ? new Date(oldest.sealedAt.getTime() + window * HOUR) : null;
    return {
      pending: pending.length,
      oldestSealedAt: oldest?.sealedAt ?? null,
      deadline,
      overdue: deadline !== null && now.getTime() >= deadline.getTime(),
    };
  }

  /**
   * The unit's records sealed in `[from, to)` by the driver the pack names today, in that driver's export format.
   *
   * @returns the export, or `null` when the pack asks nothing in this channel.
   * @throws FiscalDriverMissingError when the pack names a driver that is not registered.
   */
  async exportJournal(target: FiscalTarget, from: Date, to: Date): Promise<JournalExport | null> {
    const mandate = await this.mandate(target, this.clock.now());
    if (!mandate) return null;
    const driver = this.driver(target, mandate.driver);
    const records = (await this.journal.range(target.unitId, from, to)).filter(
      (record) => record.driver === driver.key,
    );
    return driver.exportJournal(records, { unitId: target.unitId, options: mandate.options });
  }

  /** The pack's mandate for the target's channel on a date. */
  private async mandate(target: FiscalTarget, on: Date): Promise<FiscalMandate | null> {
    return (await this.packs.section(target.market, on))?.[target.channel] ?? null;
  }

  /** The registered driver with a key. */
  private driver(target: FiscalTarget, key: string): FiscalDriver {
    const driver = this.drivers.get(key);
    if (!driver)
      throw FiscalDriverMissingError.create({
        market: target.market,
        channel: target.channel,
        driver: key,
      });
    return driver;
  }
}
