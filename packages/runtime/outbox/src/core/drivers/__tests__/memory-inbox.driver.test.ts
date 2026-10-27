/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryInboxDriver`: the first claim of an id wins and later ones are refused; `prune` forgets
 *          only ids received before its instant, which may then be claimed again; an id stored in the older ULID form
 *          is still deduplicated (STA-1380).
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

  it("deduplicates an id minted in the older ULID form beside the current form", async () => {
    const inbox = new MemoryInboxDriver();
    const old = "evt_01JB6Z3Q0M4V9TBN1XG5RD2HC8";
    await expect(inbox.claim(old, NOON)).resolves.toBe(true);
    await expect(inbox.claim("evt_01jb6z3q0m4v9tbn1xg5rd2hc8", NOON)).resolves.toBe(true);
    await expect(inbox.claim(old, LATER)).resolves.toBe(false);
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
