/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryInboxDriver`: the first claim of an id wins and later ones are refused; `prune` forgets
 *          only ids received before its instant, which may then be claimed again.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { InboxDriver } from "#contracts/index";
import { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const LATER = new Date(NOON.getTime() + 60_000);

describe(MemoryInboxDriver, () => {
  it("is an InboxDriver", () => {
    expect(new MemoryInboxDriver()).toBeInstanceOf(InboxDriver);
  });

  it("claims an id once", async () => {
    const inbox = new MemoryInboxDriver();
    await expect(inbox.claim("evt_1", NOON)).resolves.toBe(true);
    await expect(inbox.claim("evt_1", LATER)).resolves.toBe(false);
    await expect(inbox.claim("evt_2", LATER)).resolves.toBe(true);
  });

  it("forgets only the ids received before the cut-off", async () => {
    const inbox = new MemoryInboxDriver();
    await inbox.claim("evt_1", NOON);
    await inbox.claim("evt_2", LATER);
    await inbox.prune(LATER);
    await expect(inbox.claim("evt_1", LATER)).resolves.toBe(true);
    await expect(inbox.claim("evt_2", LATER)).resolves.toBe(false);
  });
});
