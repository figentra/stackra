/**
 * Stackra file contract:
 * Purpose: unit tests of `pruneAllRecords`: it prunes every registered model with `Retention` or `SoftDeletes` at the
 *          given instant, skips the others, and answers their reports in order.
 * Boundary: test only; `pruneRecords` is mocked, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0134 (decision 3); data-layer gap gov4.
 */
import type { EntitySchema } from "@mikro-orm/core";
import { Duration } from "@stackra/contracts";
import { HasPublicId, Model, Retention, SoftDeletes } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { pruneAllRecords } from "#core/functions/prune-all-records.function";
import { pruneRecords } from "#core/functions/prune-records.function";

vi.mock("#core/functions/prune-records.function", () => ({
  pruneRecords: vi.fn(async (model: { readonly name: string }) => ({
    model: model.name,
    expired: 1,
    purged: 0,
    held: 0,
  })),
}));

const NOW = new Date("2026-10-28T00:00:00Z");

class Thread extends Model.with(
  HasPublicId("thr"),
  Retention({ keep: Duration.days(90), basis: "createdAt", policy: "hard" }),
) {}

class Note extends Model.with(HasPublicId("not"), SoftDeletes) {}

class Order extends Model.with(HasPublicId("ord")) {}

describe("pruneAllRecords", () => {
  afterEach(() => {
    REGISTERED_ENTITIES.clear();
  });

  it("prunes each registered model with a retention step only", async () => {
    for (const type of [Thread, Note, Order])
      REGISTERED_ENTITIES.add({ meta: { class: type } } as unknown as EntitySchema);
    const reports = await pruneAllRecords(NOW);
    expect(reports.map((report) => report.model)).toEqual(["Thread", "Note"]);
    expect(pruneRecords).toHaveBeenCalledWith(Thread, NOW);
    expect(pruneRecords).toHaveBeenCalledWith(Note, NOW);
    expect(pruneRecords).toHaveBeenCalledTimes(2);
  });
});
