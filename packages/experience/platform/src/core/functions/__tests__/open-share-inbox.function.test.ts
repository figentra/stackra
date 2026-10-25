/**
 * Stackra file contract:
 * Purpose: unit tests of `openShareInbox`: it opens `stackra_platform` with its `share_inbox` store, and refuses
 *          where IndexedDB is missing.
 * Boundary: test only; IndexedDB is `fake-indexeddb`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (share target).
 */
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { openShareInbox } from "#core/functions/open-share-inbox.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openShareInbox", () => {
  it("opens the inbox database with its store", async () => {
    const db = await openShareInbox();
    expect(db.name).toBe("stackra_platform");
    expect(db.objectStoreNames.contains("share_inbox")).toBe(true);
    db.close();
  });

  it("refuses without IndexedDB", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(openShareInbox()).rejects.toThrow(/IndexedDB/);
  });
});
