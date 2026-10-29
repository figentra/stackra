/**
 * Stackra file contract:
 * Purpose: unit tests of `SpotlightIndexer`: `sync` replaces the entries with the allowed records, a signed-out sync
 *          only clears, and `clearOnSignOut` clears on a sign-out, on a revocation and at once when already revoked.
 * Boundary: test only; the memory driver and hand-written signals.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 2); ADR 0338 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { SpotlightConfig as BaseSpotlightConfig } from "#config/spotlight.config";
import { record } from "#core/__tests__/record.fixture";
import { USER } from "#core/__tests__/user.fixture";
import { MemoryDeviceSearchIndexDriver } from "#core/drivers/memory-device-search-index.driver";
import { SpotlightIndexer } from "#core/services/spotlight-indexer.service";

/** A host that indexes customers. */
class SpotlightConfig extends BaseSpotlightConfig {
  override kinds = ["crm.customer"];
}

/** A writable boolean signal. */
function signal(initial: boolean) {
  let value = initial;
  const listeners = new Set<(value: boolean) => void>();
  return {
    get: () => value,
    subscribe: (listener: (value: boolean) => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    set: (next: boolean) => {
      value = next;
      for (const listener of listeners) listener(next);
    },
  };
}

/** An indexer over a fresh memory index. */
function setup() {
  const index = new MemoryDeviceSearchIndexDriver();
  const indexer = new SpotlightIndexer(buildConfig(SpotlightConfig), index);
  return { index, indexer };
}

/** Lets the dropped clear promises settle. */
const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe("SpotlightIndexer", () => {
  it("replaces the entries with the records the rules allow", async () => {
    const { index, indexer } = setup();
    await index.index([
      {
        url: "figentra://stale",
        kind: "crm.customer",
        title: "Old",
        description: null,
        keywords: [],
      },
    ]);
    await indexer.sync(USER, [
      record({ updatedAt: new Date().toISOString() }),
      record({ url: "figentra://x", ownerId: "usr_2" }),
    ]);
    expect([...index.items.keys()]).toEqual(["figentra://crm/customers/cus_1"]);
    await indexer.remove(["figentra://crm/customers/cus_1"]);
    expect(index.items.size).toBe(0);
  });

  it("only clears when nobody is signed in", async () => {
    const { index, indexer } = setup();
    await indexer.sync(USER, [record({ updatedAt: new Date().toISOString() })]);
    await indexer.sync(null, [record({ updatedAt: new Date().toISOString() })]);
    expect(index.items.size).toBe(0);
  });

  it("clears on sign-out and on revocation until stopped", async () => {
    const { index, indexer } = setup();
    const isSignedIn = signal(true);
    const isRevoked = signal(false);
    const stop = indexer.clearOnSignOut({ isSignedIn, isRevoked });
    await indexer.sync(USER, [record({ updatedAt: new Date().toISOString() })]);
    isSignedIn.set(false);
    await settle();
    expect(index.items.size).toBe(0);

    await indexer.sync(USER, [record({ updatedAt: new Date().toISOString() })]);
    isRevoked.set(true);
    await settle();
    expect(index.items.size).toBe(0);

    stop();
    await indexer.sync(USER, [record({ updatedAt: new Date().toISOString() })]);
    isSignedIn.set(false);
    await settle();
    expect(index.items.size).toBe(1);
  });

  it("clears at once when the session is already revoked", async () => {
    const { index, indexer } = setup();
    await indexer.sync(USER, [record({ updatedAt: new Date().toISOString() })]);
    indexer.clearOnSignOut({ isSignedIn: signal(false), isRevoked: signal(true) });
    await settle();
    expect(index.items.size).toBe(0);
  });
});
