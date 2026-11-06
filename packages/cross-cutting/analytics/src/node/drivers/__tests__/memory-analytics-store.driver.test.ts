/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAnalyticsStoreDriver`: it keeps a delivery once per event id, scans a capture-time
 *          window oldest first (from inclusive, to exclusive, compared as instants) filtered by name, refuses a bound
 *          that is not an instant, and erases a subject's identified and anonymous deliveries.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0189 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsStore } from "#contracts/ports/analytics-store.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import type { AnalyticsStoreQuery } from "#contracts/types/analytics-store-query.type";
import { MemoryAnalyticsStoreDriver } from "#node/drivers/memory-analytics-store.driver";

/** A delivery with the given id, name, capture time and visitor. */
function delivery(
  eventId: string,
  name: string,
  occurredAt: string,
  anonymousId = "anon_1",
  userId?: string,
): AnalyticsDelivery {
  return {
    eventId,
    name,
    properties: {},
    occurredAt,
    anonymousId,
    ...(userId === undefined ? {} : { userId }),
    sessionId: "ses_1",
    context: { library: { name: "@stackra/analytics" } },
  };
}

/** The event ids `query` scans, in order. */
async function scanned(store: AnalyticsStore, query: AnalyticsStoreQuery): Promise<string[]> {
  const ids: string[] = [];
  for await (const kept of store.scan(query)) ids.push(kept.eventId);
  return ids;
}

const DAY = { from: "2026-11-01T00:00:00Z", to: "2026-11-02T00:00:00Z" };

describe("MemoryAnalyticsStoreDriver", () => {
  it("keeps a delivery once per event id and scans oldest first", async () => {
    const store = new MemoryAnalyticsStoreDriver();
    expect(store).toBeInstanceOf(AnalyticsStore);
    await store.append([
      delivery("evt_b", "lead.submitted", "2026-11-01T10:00:00Z"),
      delivery("evt_a", "page.viewed", "2026-11-01T09:00:00Z"),
    ]);
    await store.append([delivery("evt_a", "page.viewed", "2026-11-01T23:00:00Z")]);
    expect(await scanned(store, DAY)).toEqual(["evt_a", "evt_b"]);
  });

  it("reads from inclusive to exclusive, as instants, and only the names asked", async () => {
    const store = new MemoryAnalyticsStoreDriver();
    await store.append([
      delivery("evt_start", "page.viewed", "2026-11-01T00:00:00.000Z"),
      delivery("evt_offset", "page.viewed", "2026-11-01T23:30:00-01:00"),
      delivery("evt_end", "page.viewed", "2026-11-02T00:00:00Z"),
      delivery("evt_lead", "lead.submitted", "2026-11-01T12:00:00Z"),
    ]);
    expect(await scanned(store, DAY)).toEqual(["evt_start", "evt_lead"]);
    expect(await scanned(store, { ...DAY, names: ["lead.submitted"] })).toEqual(["evt_lead"]);
    expect(await scanned(store, { ...DAY, names: [] })).toEqual([]);
  });

  it("refuses a bound that is not an instant", () => {
    const store = new MemoryAnalyticsStoreDriver();
    expect(() => store.scan({ from: "yesterday", to: DAY.to })).toThrow(RangeError);
  });

  it("erases the subject's identified deliveries and those of its anonymous ids", async () => {
    const store = new MemoryAnalyticsStoreDriver();
    await store.append([
      delivery("evt_before", "page.viewed", "2026-11-01T08:00:00Z", "anon_1"),
      delivery("evt_signed", "lead.submitted", "2026-11-01T09:00:00Z", "anon_1", "usr_1"),
      delivery("evt_other", "page.viewed", "2026-11-01T10:00:00Z", "anon_2", "usr_2"),
    ]);
    expect(await store.erasePerson("usr_1")).toBe(2);
    expect(await scanned(store, DAY)).toEqual(["evt_other"]);
    expect(await store.erasePerson("usr_1")).toBe(0);
  });
});
