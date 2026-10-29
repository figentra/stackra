/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDeviceSearchIndexDriver`: entries are kept by link, removed and cleared, and `open`
 *          reaches the listeners until they stop.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0478.
 */
import { describe, expect, it } from "@stackra/testing";

import { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
import { MemoryDeviceSearchIndexDriver } from "#core/drivers/memory-device-search-index.driver";

/** An entry with link `url`. */
const item = (url: string) => ({
  url,
  kind: "crm.customer",
  title: url,
  description: null,
  keywords: [],
});

describe("MemoryDeviceSearchIndexDriver", () => {
  it("is a DeviceSearchIndex that keeps, replaces, removes and clears entries by link", async () => {
    const index = new MemoryDeviceSearchIndexDriver();
    expect(index).toBeInstanceOf(DeviceSearchIndex);
    await index.index([item("figentra://a"), item("figentra://b"), item("figentra://a")]);
    expect([...index.items.keys()]).toEqual(["figentra://a", "figentra://b"]);
    await index.remove(["figentra://a"]);
    expect([...index.items.keys()]).toEqual(["figentra://b"]);
    await index.clear();
    expect(index.items.size).toBe(0);
  });

  it("tells listeners of an opened entry until they stop", () => {
    const index = new MemoryDeviceSearchIndexDriver();
    const opened: string[] = [];
    const stop = index.opened((url) => opened.push(url));
    index.open("figentra://a");
    stop();
    index.open("figentra://b");
    expect(opened).toEqual(["figentra://a"]);
  });
});
