/**
 * Stackra file contract:
 * Purpose: unit tests of `journalOf`: one token per model, reused, named after the model, a `Journal` that takes
 *          `Locks`, and a different token for a different model.
 * Boundary: test only; the token is built with the real `Locks` over the memory lock driver and never queried.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0145 and ADR 0263 as
 *                     amended by ADR 0294.
 */
import { Clock } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { AppendOnly, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { journalOf } from "#node/functions/journal-of.function";
import { Journal } from "#node/services/journal.service";

/** One entry model. */
class LedgerEntry extends Model.with(AppendOnly) {}

/** Another entry model. */
class WalletEntry extends Model.with(AppendOnly) {}

/** Reads the host clock. */
class HostClock extends Clock {
  now(): Date {
    return new Date();
  }
}

describe("journalOf", () => {
  it("makes one Journal token per model and reuses it", () => {
    const token = journalOf(LedgerEntry);

    expect(journalOf(LedgerEntry)).toBe(token);
    expect(journalOf(WalletEntry)).not.toBe(token);
    expect(token.name).toBe("LedgerEntryJournal");
  });

  it("builds a Journal from Locks alone, as the container does", () => {
    const clock = new HostClock();
    const Token = journalOf(LedgerEntry);

    expect(new Token(new Locks(new MemoryLockDriver(clock), clock))).toBeInstanceOf(Journal);
  });
});
