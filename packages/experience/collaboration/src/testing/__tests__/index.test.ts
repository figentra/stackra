/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the three memory drivers, each a driver of its port.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { PresenceChannel, SnapshotStore, SyncTransport } from "#contracts/index";
import * as testing from "#testing/index";

describe("@stackra/collaboration/testing", () => {
  it("exports exactly the memory drivers", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "MemoryPresenceChannelDriver",
      "MemorySnapshotStoreDriver",
      "MemorySyncTransportDriver",
    ]);
  });

  it("drives the three ports", () => {
    expect(new testing.MemoryPresenceChannelDriver()).toBeInstanceOf(PresenceChannel);
    expect(new testing.MemorySyncTransportDriver()).toBeInstanceOf(SyncTransport);
    expect(new testing.MemorySnapshotStoreDriver()).toBeInstanceOf(SnapshotStore);
  });
});
