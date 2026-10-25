/**
 * Stackra file contract:
 * Purpose: unit tests of `OUTBOX_SYNC_TAG`: the outbox's Background Sync tag.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { OUTBOX_SYNC_TAG } from "#sw/constants/outbox-sync-tag.constant";

describe("OUTBOX_SYNC_TAG", () => {
  it("is stackra_outbox", () => {
    expect(OUTBOX_SYNC_TAG).toBe("stackra_outbox");
  });
});
