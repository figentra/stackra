/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresSettingRevisionStoreDriver`: rows become revisions (public id, holder, ISO times, a
 *          null lock left out); append stores through the service and answers the stored row as a revision; due asks for
 *          an instant as a date and answers the rows as revisions, oldest first as the service orders them; find
 *          answers null for no row; update moves a row and refuses an unknown id.
 * Boundary: test only; the service is a stand-in over fixed rows, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SettingRevisionStore } from "#contracts/index";
import { PostgresSettingRevisionStoreDriver } from "#node/drivers/postgres-setting-revision-store.driver";
import { StoredSettingRevision } from "#node/models/stored-setting-revision.model";
import type { StoredSettingRevisionService } from "#node/services/stored-setting-revision.service";

/** A stored user revision. */
const ROW = Object.assign(new StoredSettingRevision(), {
  groupKey: "orders",
  scopeId: null,
  scopePath: null,
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0",
  values: { a: 1 },
  removed: [],
  locked: null,
  previous: {},
  author: "usr_a",
  reason: null,
  environment: "live",
  breakGlass: false,
  status: "pending",
  effectiveAt: new Date("2026-10-25T10:00:00.000Z"),
  createdAt: new Date("2026-10-25T10:00:00.000Z"),
  decidedBy: null,
  appliedAt: null,
});

/** The driver over `row`, with `due` the rows the service answers for a due-at query. */
function driverOver(row: StoredSettingRevision | null, due: readonly StoredSettingRevision[] = []) {
  const update = vi.fn(async (_where: object, data: object) => Object.assign(row ?? ROW, data));
  const append = vi.fn(async (_revision: object) => ROW);
  const dueAt = vi.fn(async (_at: Date) => due);
  const rows = {
    findOne: async () => row,
    listOf: async () => (row === null ? [] : [row]),
    dueAt,
    append,
    update,
  } as unknown as StoredSettingRevisionService;
  return { driver: new PostgresSettingRevisionStoreDriver(rows), update, append, dueAt };
}

describe(PostgresSettingRevisionStoreDriver, () => {
  it("is a SettingRevisionStore that hands rows on as revisions", async () => {
    const { driver } = driverOver(ROW);
    expect(driver).toBeInstanceOf(SettingRevisionStore);
    const [revision] = await driver.list("orders", { user: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" });
    expect(revision).toMatchObject({
      id: ROW.id,
      target: { user: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" },
      effectiveAt: "2026-10-25T10:00:00.000Z",
      appliedAt: null,
    });
    expect(revision).not.toHaveProperty("locked");
  });

  it("answers null for no row and refuses to update one", async () => {
    const { driver } = driverOver(null);
    await expect(driver.find("ssr_x")).resolves.toBeNull();
    await expect(driver.update("ssr_x", { status: "applied" })).rejects.toThrow(TypeError);
  });

  it("appends a revision through the service and answers the stored row as a revision", async () => {
    const { driver, append } = driverOver(ROW);
    const listed = (await driver.list("orders", { user: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" })).at(0);
    if (listed === undefined) throw new TypeError("the stand-in service answered no row");
    const { id, ...revision } = listed;
    const stored = await driver.append(revision);
    expect(append).toHaveBeenCalledExactlyOnceWith(revision);
    expect(stored).toMatchObject({
      id,
      group: "orders",
      target: { user: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" },
      effectiveAt: "2026-10-25T10:00:00.000Z",
      createdAt: "2026-10-25T10:00:00.000Z",
      appliedAt: null,
    });
  });

  it("asks the service for the revisions due at an instant, as a date, and answers them as revisions", async () => {
    const later = Object.assign(new StoredSettingRevision(), ROW, {
      status: "scheduled",
      effectiveAt: new Date("2026-10-27T08:30:00.000Z"),
    });
    const { driver, dueAt } = driverOver(ROW, [later, ROW]);
    const revisions = await driver.due("2026-10-28T00:00:00.000Z");
    expect(dueAt).toHaveBeenCalledExactlyOnceWith(new Date("2026-10-28T00:00:00.000Z"));
    expect(revisions.map((revision) => revision.effectiveAt)).toEqual([
      "2026-10-27T08:30:00.000Z",
      "2026-10-25T10:00:00.000Z",
    ]);
    expect(revisions[0]).toMatchObject({ status: "scheduled", appliedAt: null });
  });

  it("answers no revision when none is due", async () => {
    const { driver, dueAt } = driverOver(ROW);
    await expect(driver.due("2026-10-24T00:00:00.000Z")).resolves.toEqual([]);
    expect(dueAt).toHaveBeenCalledOnce();
  });

  it("moves a row's state with ISO times as dates", async () => {
    const { driver, update } = driverOver(ROW);
    await driver.update(ROW.id, { status: "applied", appliedAt: "2026-10-26T00:00:00.000Z" });
    expect(update).toHaveBeenCalledWith(
      { id: ROW.id },
      { status: "applied", appliedAt: new Date("2026-10-26T00:00:00.000Z") },
    );
  });
});
