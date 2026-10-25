/**
 * Stackra file contract:
 * Purpose: type tests of `MemoryNotifier`: the type of the memory driver, so the bound `Notifier` casts to it and its
 *          `sent(Class)` deliveries carry the recipient, as the template's receipt test reads them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (decision 2); ADR 0269 (decision 3).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MemoryNotifierDriver, type Notifier, type Recipient } from "#core/index";
import type { MemoryNotifier } from "#testing/types/memory-notifier.type";

describe("MemoryNotifier", () => {
  it("is the memory driver's type, reachable from a bound Notifier", () => {
    const bound: Notifier = new MemoryNotifierDriver();
    const memory = bound as MemoryNotifier;
    expectTypeOf<MemoryNotifier>().toEqualTypeOf<MemoryNotifierDriver>();
    expectTypeOf(memory.sent()[0]?.recipient).toEqualTypeOf<Recipient | undefined>();
    expect(memory.sent()).toEqual([]);
  });
});
