/**
 * Stackra file contract:
 * Purpose: `journalOver(model, entries)`, the `Journal` the tests share: a journal over `model` whose entries live in
 *          a `MemoryEntries`, with the real `Locks` on the memory lock driver.
 * Boundary: test fixture only; nothing here reaches a database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0220 (decisions 4 and 5).
 */
import type { AnyClass } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { Locks, MemoryLockDriver } from "@stackra/locking";

import { journalOf } from "#node/functions/journal-of.function";
import type { Journal } from "#node/services/journal.service";

import type { MemoryEntries } from "./memory-entries.fixture";

/** Reads the host clock. */
class HostClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** A journal over `model` whose entries live in `entries`. */
export function journalOver<M extends object>(
  model: AnyClass<M>,
  entries: MemoryEntries,
): Journal<M> {
  const clock = new HostClock();
  class MemoryJournal extends journalOf(model) {
    // journalOf's type is `Journal<M>`, whose `model` is abstract, so a subclass names it again.
    protected override readonly model: AnyClass<M> = model;

    protected override entries(): Repository<M> {
      // reason: the memory store has the repository methods the journal calls, untyped by model
      return entries as unknown as Repository<M>;
    }
  }
  return new MemoryJournal(new Locks(new MemoryLockDriver(clock), clock));
}
