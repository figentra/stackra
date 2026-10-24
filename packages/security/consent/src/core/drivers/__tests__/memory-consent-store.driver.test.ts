/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryConsentStoreDriver`: empty at first, keeps the last record written, forgets it on
 *          clear, and two instances never share a record.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (memory drivers first).
 */
import { describe, expect, it } from "@stackra/testing";

import { ConsentStore } from "#contracts/ports/consent-store.port";
import { MemoryConsentStoreDriver } from "#core/drivers/memory-consent-store.driver";

/** A stored decision. */
const RECORD = { policyVersion: "1", decidedAt: "2026-10-24T09:00:00.000Z", categories: {} };

describe("MemoryConsentStoreDriver", () => {
  it("is an empty ConsentStore at first", () => {
    const store = new MemoryConsentStoreDriver();
    expect(store).toBeInstanceOf(ConsentStore);
    expect(store.read()).toBeNull();
  });

  it("keeps the last record and forgets it on clear", () => {
    const store = new MemoryConsentStoreDriver();
    store.write(RECORD);
    const next = { ...RECORD, categories: { analytics: true } };
    store.write(next);
    expect(store.read()).toBe(next);
    store.clear();
    expect(store.read()).toBeNull();
  });

  it("never shares a record between instances", () => {
    const first = new MemoryConsentStoreDriver();
    first.write(RECORD);
    expect(new MemoryConsentStoreDriver().read()).toBeNull();
  });
});
