/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryScheduleDriver`: it stores schedules with their input as JSON, lists them by scope,
 *          claims every one with no owner and loads one by id, deletes one only from its own scope (with its
 *          watermark and fires), records each fire once, and keeps watermarks by key, never moving one back.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0148 (decision 5).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Misfire, ScheduleDriver } from "#contracts/index";
import type { Schedule } from "#contracts/index";
import { MemoryScheduleDriver } from "#core/drivers/memory-schedule.driver";

const acme: ScopeRef = { id: "scp_acme", path: "platform.acme" };

const globex: ScopeRef = { id: "scp_globex", path: "platform.globex" };

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

/** A stored schedule of `scope`. */
const scheduleOf = (id: `sch_${string}`, scope: ScopeRef): Schedule => ({
  id,
  scope,
  key: "digests.digest.send@1",
  cron: "0 8 * * mon",
  timeZone: "Asia/Dubai",
  input: { since: NOON },
  misfire: Misfire.Once,
  createdAt: NOON,
});

describe(MemoryScheduleDriver, () => {
  it("is a ScheduleDriver", () => {
    expect(new MemoryScheduleDriver()).toBeInstanceOf(ScheduleDriver);
  });

  it("stores schedules with their input as JSON and lists them by scope", async () => {
    const driver = new MemoryScheduleDriver();
    await driver.add(scheduleOf("sch_1", acme));
    await driver.add(scheduleOf("sch_2", globex));
    const [first] = await driver.schedules(acme);
    expect(first?.id).toBe("sch_1");
    expect(first?.input).toEqual({ since: NOON.toISOString() });
    expect((await driver.schedules(globex)).map((schedule) => schedule.id)).toEqual(["sch_2"]);
  });

  it("claims every schedule with what decides its runs and no owner, and loads one by id", async () => {
    const driver = new MemoryScheduleDriver();
    await driver.add(scheduleOf("sch_1", acme));
    await driver.add(scheduleOf("sch_2", globex));
    expect(await driver.claim()).toEqual([
      {
        id: "sch_1",
        key: "digests.digest.send@1",
        cron: "0 8 * * mon",
        timeZone: "Asia/Dubai",
        misfire: Misfire.Once,
        createdAt: NOON,
      },
      expect.objectContaining({ id: "sch_2" }),
    ]);
    expect(await driver.load("sch_2")).toMatchObject({ id: "sch_2", scope: globex });
    expect(await driver.load("sch_3")).toBeUndefined();
  });

  it("deletes a schedule only from its own scope, with its watermark", async () => {
    const driver = new MemoryScheduleDriver();
    await driver.add(scheduleOf("sch_1", acme));
    await driver.advance(["sch_1", "orders.order.expire_unpaid@1"], NOON);
    await expect(driver.remove("sch_1", globex)).resolves.toBe(false);
    await expect(driver.remove("sch_1", acme)).resolves.toBe(true);
    await expect(driver.remove("sch_1", acme)).resolves.toBe(false);
    expect([...(await driver.watermarks()).keys()]).toEqual(["orders.order.expire_unpaid@1"]);
  });

  it("records each fire once, forgets fires through an instant, and deletes a schedule's fires with it", async () => {
    const driver = new MemoryScheduleDriver();
    const later = new Date(NOON.getTime() + 60_000);
    await expect(driver.recordFire("sch_1", NOON)).resolves.toBe(true);
    await expect(driver.recordFire("sch_1", NOON)).resolves.toBe(false);
    await expect(driver.recordFire("sch_1", later)).resolves.toBe(true);
    await driver.forgetFires("sch_1", NOON);
    await expect(driver.recordFire("sch_1", NOON)).resolves.toBe(true);
    await expect(driver.recordFire("sch_1", later)).resolves.toBe(false);
    await driver.add(scheduleOf("sch_1", acme));
    await driver.remove("sch_1", acme);
    await expect(driver.recordFire("sch_1", later)).resolves.toBe(true);
  });

  it("runs work as it is, with no transaction", async () => {
    await expect(new MemoryScheduleDriver().transaction(async () => 7)).resolves.toBe(7);
  });

  it("never moves a watermark back", async () => {
    const driver = new MemoryScheduleDriver();
    const later = new Date(NOON.getTime() + 60_000);
    await driver.advance(["a"], later);
    await driver.advance(["a"], NOON);
    expect((await driver.watermarks()).get("a")).toEqual(later);
  });

  it("sets and moves watermarks by key, as copies", async () => {
    const driver = new MemoryScheduleDriver();
    const later = new Date(NOON.getTime() + 60_000);
    await driver.advance(["a", "b"], NOON);
    await driver.advance(["b"], later);
    const marks = await driver.watermarks();
    expect(marks.get("a")).toEqual(NOON);
    expect(marks.get("b")).toEqual(later);
    expect(marks.get("a")).not.toBe(NOON);
  });
});
