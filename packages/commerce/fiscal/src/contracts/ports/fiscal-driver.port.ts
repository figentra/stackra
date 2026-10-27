/**
 * Stackra file contract:
 * Purpose: `FiscalDriver`, the one port every e-invoicing mandate and till fiscal device implements: seal a document
 *          offline, submit a sealed record, poll a submitted record's verdict where the authority validates later,
 *          export a journal.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalDriver`. Many drivers are registered at once and
 *           the pack's `driver` value picks one per market and channel, matched on `key`. A driver parses its own
 *           options and never reads the clock, a secret or the network except through its ports. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2, 3 and 7); ADR 0363 (decision 3: a driver may serve one country,
 *                     choosing it is pack data).
 */
import { Port } from "@stackra/contracts";

import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";

/**
 * A mandate's mechanism. `seal` must work with no network for till drivers whose law allows offline issuing.
 *
 * @example
 * export class MyDriver extends Driver(FiscalDriver) {
 *   readonly key = "my-mandate";
 *   async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> { … }
 * }
 */
export abstract class FiscalDriver extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalDriver";

  /** The key a pack names to choose this driver. */
  abstract readonly key: string;

  /** Builds, hashes, signs and chains the document; the result becomes a `FiscalRecord`. */
  abstract seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload>;

  /** Hands a sealed record to the authority; throws `FiscalAuthorityUnavailableError` when it cannot be reached. */
  abstract submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome>;

  /**
   * Asks the authority for its verdict on a `submitted` record (validity polling, ADR 0364 open question 2): the new
   * outcome, or `null` while the authority has not decided. Only drivers whose authority validates after accepting
   * implement it; `FiscalService.pollSubmitted` skips the others.
   *
   * @throws FiscalAuthorityUnavailableError when the authority cannot be reached.
   */
  poll?(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome | null>;

  /** The unit's records in the mandate's audit export format. */
  abstract exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport>;
}
