/**
 * Stackra file contract:
 * Purpose: unit tests of `RevisionService`: `draft` numbers after the latest revision in the scope, `publish` and
 *          `schedule` change the revision they find, `current` reads the latest published, `publishDue` publishes at
 *          the scheduled time, `unschedule` clears a campaign, and `rollback` republishes the revision before the
 *          current one or refuses with `not_found`.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321 (decisions 2 and 6); ADR 0116 (decision CT3).
 */
import type { ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Revision } from "#node/models/revision.model";
import { RevisionService } from "#node/services/revision.service";

registerModelPartners([[RevisionService, Revision]]);

const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const PRODUCT = "catalogue.product";
const RECORD = "prd_01j9z3k4m5n6p7q8r9s0t1v2w1";
const MONDAY = new Date("2026-10-26T09:00:00Z");
const TUESDAY = new Date("2026-10-27T09:00:00Z");

/** A stored revision. */
function revision(fields: Partial<Revision>): Revision {
  return Object.assign(new Revision(), { model: PRODUCT, recordId: RECORD, data: {}, ...fields });
}

/** Connects a recording entity manager whose reads answer `rows`. */
function connect(rows: Revision[] = []) {
  const em = {
    find: vi.fn(async (_model: unknown, _where: unknown, _options?: unknown) => rows),
    findOneOrFail: vi.fn(async () => rows[0]),
    create: vi.fn((Row: new () => object, data: object) => Object.assign(new Row(), data)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(RevisionService, () => {
  it("drafts the next number in the scope", async () => {
    const em = connect([revision({ number: 3 })]);
    const draft = await new RevisionService().draft(SCOPE, PRODUCT, RECORD, { title: "Shirt" });
    expect(draft).toMatchObject({
      scopeId: SCOPE.id,
      scopePath: SCOPE.path,
      model: PRODUCT,
      recordId: RECORD,
      number: 4,
      data: { title: "Shirt" },
    });
    expect(em.find.mock.calls[0]?.[2]).toEqual({ orderBy: { number: "desc" }, limit: 1 });
    connect();
    expect((await new RevisionService().draft(SCOPE, PRODUCT, RECORD, {})).number).toBe(1);
  });

  it("publishes and schedules the revision it finds", async () => {
    const stored = revision({ number: 2, scheduledAt: TUESDAY });
    connect([stored]);
    const service = new RevisionService();
    await service.schedule(PRODUCT, RECORD, 2, TUESDAY, "black_friday");
    expect(stored).toMatchObject({ scheduledAt: TUESDAY, campaign: "black_friday" });
    await service.publish(PRODUCT, RECORD, 2, MONDAY);
    expect(stored).toMatchObject({ publishedAt: MONDAY, scheduledAt: null });
  });

  it("reads the current revision, or null", async () => {
    const latest = revision({ number: 5, publishedAt: TUESDAY });
    connect([latest]);
    expect(await new RevisionService().current(PRODUCT, RECORD)).toBe(latest);
    connect();
    expect(await new RevisionService().current(PRODUCT, RECORD)).toBeNull();
  });

  it("publishes what is due at its scheduled time and unschedules a campaign", async () => {
    const due = revision({ number: 2, scheduledAt: MONDAY });
    const em = connect([due]);
    expect(await new RevisionService().publishDue(TUESDAY)).toEqual([due]);
    expect(due).toMatchObject({ publishedAt: MONDAY, scheduledAt: null });
    expect(em.find.mock.calls[0]?.[1]).toEqual({
      publishedAt: null,
      scheduledAt: { $lte: TUESDAY },
    });
    const planned = revision({ number: 3, scheduledAt: TUESDAY, campaign: "eid" });
    connect([planned]);
    expect(await new RevisionService().unschedule("eid")).toEqual([planned]);
    expect(planned.scheduledAt).toBeNull();
  });

  it("rolls back to the revision published before, or refuses", async () => {
    const before = revision({ number: 1, publishedAt: MONDAY });
    connect([revision({ number: 2, publishedAt: TUESDAY }), before]);
    expect(await new RevisionService().rollback(PRODUCT, RECORD, TUESDAY)).toBe(before);
    expect(before.publishedAt).toEqual(TUESDAY);
    connect([revision({ number: 1, publishedAt: MONDAY })]);
    const refused = await new RevisionService()
      .rollback(PRODUCT, RECORD, TUESDAY)
      .catch((error: unknown) => error);
    expect(isRefusal(refused, NotFoundError)).toBe(true);
  });
});
