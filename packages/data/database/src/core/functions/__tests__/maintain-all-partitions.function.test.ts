/**
 * Stackra file contract:
 * Purpose: unit tests of `maintainAllPartitions`: it maintains every registered `Partitioned` model at the given
 *          instant, skips the others, and answers their reports in order.
 * Boundary: test only; `maintainPartitions` is mocked, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gaps db12, sc4.
 */
import type { EntitySchema } from "@mikro-orm/core";
import { Duration } from "@stackra/contracts";
import { HasPublicId, Model, Partitioned } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { maintainAllPartitions } from "#core/functions/maintain-all-partitions.function";
import { maintainPartitions } from "#core/functions/maintain-partitions.function";

vi.mock("#core/functions/maintain-partitions.function", () => ({
  maintainPartitions: vi.fn(async (model: { readonly name: string }) => ({
    table: model.name,
    created: ["p1"],
    dropped: [],
    held: [],
  })),
}));

const NOW = new Date("2026-10-28T00:00:00Z");

class Hit extends Model.with(
  HasPublicId("hit"),
  Partitioned({ by: "occurredAt", interval: "month", premake: 1, retain: Duration.days(60) }),
) {}

class Order extends Model.with(HasPublicId("ord")) {}

describe("maintainAllPartitions", () => {
  afterEach(() => {
    REGISTERED_ENTITIES.clear();
  });

  it("maintains each registered partitioned model only", async () => {
    for (const type of [Hit, Order])
      REGISTERED_ENTITIES.add({ meta: { class: type } } as unknown as EntitySchema);
    expect(await maintainAllPartitions(NOW)).toEqual([
      { table: "Hit", created: ["p1"], dropped: [], held: [] },
    ]);
    expect(maintainPartitions).toHaveBeenCalledWith(Hit, NOW);
    expect(maintainPartitions).toHaveBeenCalledTimes(1);
  });
});
