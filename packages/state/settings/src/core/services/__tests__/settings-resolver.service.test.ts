/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsResolver`: floors lift a stored value and a default on read (typed `get` and page
 *          `resolve`) with provenance; a write below a floor, or on live to a key that is not live-editable, is
 *          refused (break-glass needs a reason and then passes; a user's own write passes); a write is applied, held
 *          for approval or scheduled; four-eyes refuses the author, approval applies or schedules, reject closes;
 *          `applyDue` applies what is due and keeps a failing revision scheduled; `applyChange` writes, removes and
 *          records.
 * Boundary: test only; memory drivers and a fixed clock, the schema registered by hand as gen's schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decisions 2 and 5); ADR 0359 (decisions 3 to 5 and 9); ADR 0370
 *                     (decision 6).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { LiveReadOnlyError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { SettingEnvironment, SettingRevisionStatus, SettingSource } from "#contracts/index";
import type { SettingFloor } from "#contracts/index";
import { Settings } from "#core/bases/settings.base";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingType } from "#core/enums/setting-type.enum";
import { SettingBelowFloorError } from "#core/errors/setting-below-floor.error";
import { SettingFourEyesError } from "#core/errors/setting-four-eyes.error";
import { SettingRevisionClosedError } from "#core/errors/setting-revision-closed.error";
import { settingKeys } from "#core/functions/setting-keys.function";
import { settingsPage } from "#core/functions/settings-page.function";
import { SettingsResolver } from "#core/services/settings-resolver.service";

class ReturnsSettings extends Settings({ scopes: [SettingScope.Platform, SettingScope.Product] }) {
  @Int({ min: 0 })
  windowDays = 7;

  guestRefunds = false;

  mode = "cash";
}

registerSchemas([
  [
    ReturnsSettings,
    z.object({
      windowDays: z.number().int().min(0).default(7),
      guestRefunds: z.boolean().default(false),
      mode: z.string().default("cash"),
    }),
  ],
]);

const label = (key: string) => `returns::settings.${key}.label` as I18nKey;
const CASCADE = [SettingScope.Platform, SettingScope.Product];
settingKeys({
  returns: {
    windowDays: {
      type: SettingType.Integer,
      default: 7,
      min: 0,
      scopes: CASCADE,
      label: label("window_days"),
      live: true,
      essential: true,
      floor: "consumer.withdrawal_days",
    },
    guestRefunds: {
      type: SettingType.Boolean,
      default: false,
      scopes: CASCADE,
      label: label("guest_refunds"),
      live: true,
      approval: true,
    },
    mode: { type: SettingType.String, default: "cash", scopes: CASCADE, label: label("mode") },
  },
});
const PAGE = settingsPage("returns", { scope: SettingScope.Product });

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" as const;
const FLOOR: SettingFloor = {
  path: "windowDays",
  value: 14,
  bound: "min",
  law: "EU 2011/83",
  market: "eu",
  version: "1.2.0",
};
const LIVE = { environment: SettingEnvironment.Live, author: "usr_author" };

/** A resolver over memory drivers at `now`, with the EU floor seeded. */
function setup(now = "2026-10-25T10:00:00.000Z") {
  const clock = { at: new Date(now), now: () => new Date(clock.at) };
  const values = new MemorySettingValueStoreDriver();
  const floors = new MemorySettingFloorSourceDriver().seed("returns", [FLOOR]);
  const revisions = new MemorySettingRevisionStoreDriver();
  const resolver = new SettingsResolver(values, floors, revisions, clock as unknown as Clock);
  return { clock, values, floors, revisions, resolver };
}

describe(SettingsResolver, () => {
  it("lifts a default below the floor in the typed read", async () => {
    const returns = await setup().resolver.get(ReturnsSettings, { scope: ACME });
    expect(returns.windowDays).toBe(14);
    expect(returns.mode).toBe("cash");
  });

  it("resolves each key with its provenance, floor and flags", async () => {
    const { values, resolver } = setup();
    await values.write("returns", { scope: ACME }, { windowDays: 30, mode: "credit" });
    const page = await resolver.resolve(PAGE, { scope: ACME });
    expect(page["windowDays"]).toEqual({
      value: 30,
      source: SettingSource.Layer,
      holder: "platform.acme",
      floor: FLOOR,
      locked: false,
      live: true,
      essential: true,
    });
    expect(page["guestRefunds"]).toMatchObject({
      value: false,
      source: SettingSource.Default,
      holder: null,
    });
  });

  it("lifts a stored value when a floor rises and says so", async () => {
    const { values, floors, resolver } = setup();
    await values.write("returns", { scope: ACME }, { windowDays: 20 });
    floors.seed("returns", [{ ...FLOOR, value: 28 }]);
    const page = await resolver.resolve(PAGE, { scope: ACME });
    expect(page["windowDays"]).toMatchObject({
      value: 28,
      source: SettingSource.Floor,
      holder: null,
    });
  });

  it("refuses a write below the floor and records nothing", async () => {
    const { revisions, resolver } = setup();
    await expect(
      resolver.write(PAGE, { windowDays: 7 }, { scope: ACME }, LIVE),
    ).rejects.toBeInstanceOf(SettingBelowFloorError);
    await expect(revisions.list("returns", { scope: ACME })).resolves.toEqual([]);
  });

  it("refuses a structural key on live, unless break-glass with a reason or a user's own write", async () => {
    const { resolver } = setup();
    const refused = await resolver
      .write(PAGE, { mode: "credit" }, { scope: ACME }, LIVE)
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(LiveReadOnlyError);
    expect((refused as LiveReadOnlyError).code).toBe("live_read_only");
    expect((refused as LiveReadOnlyError).fieldErrors).toEqual({ mode: "live_read_only" });
    await expect(
      resolver.write(PAGE, { mode: "credit" }, { scope: ACME }, { ...LIVE, breakGlass: true }),
    ).rejects.toThrow(TypeError);
    const glass = await resolver.write(
      PAGE,
      { mode: "credit" },
      { scope: ACME },
      { ...LIVE, breakGlass: true, reason: "incident 42" },
    );
    expect(glass).toMatchObject({ status: SettingRevisionStatus.Applied, breakGlass: true });
    await expect(
      resolver.write(
        PAGE,
        { mode: "credit" },
        { scope: ACME },
        { ...LIVE, environment: SettingEnvironment.Sandbox },
      ),
    ).resolves.toMatchObject({ status: SettingRevisionStatus.Applied });
    await expect(resolver.write(PAGE, { mode: "x" }, { user: USER }, LIVE)).resolves.toMatchObject({
      status: SettingRevisionStatus.Applied,
    });
  });

  it("applies a live write now and records the value it replaced", async () => {
    const { values, resolver } = setup();
    await values.write("returns", { scope: ACME }, { windowDays: 20 });
    const revision = await resolver.write(PAGE, { windowDays: 30 }, { scope: ACME }, LIVE);
    expect(revision).toMatchObject({
      status: SettingRevisionStatus.Applied,
      values: { windowDays: 30 },
      previous: { windowDays: 20 },
      appliedAt: "2026-10-25T10:00:00.000Z",
    });
    await expect(resolver.history("returns", { scope: ACME })).resolves.toEqual([revision]);
  });

  it("holds a key that needs approval, refuses its author and applies on a second approver", async () => {
    const { values, resolver } = setup();
    const pending = await resolver.write(PAGE, { guestRefunds: true }, { scope: ACME }, LIVE);
    expect(pending.status).toBe(SettingRevisionStatus.Pending);
    await expect(values.layers("returns", { scope: ACME })).resolves.toEqual([]);
    await expect(resolver.approve(pending.id, "usr_author")).rejects.toBeInstanceOf(
      SettingFourEyesError,
    );
    const applied = await resolver.approve(pending.id, "usr_second");
    expect(applied).toMatchObject({
      status: SettingRevisionStatus.Applied,
      decidedBy: "usr_second",
    });
    await expect(resolver.approve(pending.id, "usr_third")).rejects.toBeInstanceOf(
      SettingRevisionClosedError,
    );
    expect((await resolver.get(ReturnsSettings, { scope: ACME })).guestRefunds).toBe(true);
  });

  it("schedules a later write, rejects or applies it when due", async () => {
    const { clock, resolver } = setup();
    const later = new Date("2026-11-01T00:00:00.000Z");
    const first = await resolver.write(
      PAGE,
      { windowDays: 30 },
      { scope: ACME },
      { ...LIVE, effectiveAt: later },
    );
    const second = await resolver.write(
      PAGE,
      { windowDays: 21 },
      { scope: ACME },
      { ...LIVE, effectiveAt: later },
    );
    expect(first.status).toBe(SettingRevisionStatus.Scheduled);
    await resolver.reject(second.id, "usr_b");
    await expect(resolver.reject(second.id, "usr_b")).rejects.toBeInstanceOf(
      SettingRevisionClosedError,
    );
    await expect(resolver.applyDue()).resolves.toEqual([]);
    clock.at = new Date("2026-11-02T00:00:00.000Z");
    const applied = await resolver.applyDue();
    expect(applied.map((revision) => revision.id)).toEqual([first.id]);
    expect((await resolver.get(ReturnsSettings, { scope: ACME })).windowDays).toBe(30);
  });

  it("keeps a due revision scheduled when a risen floor refuses it", async () => {
    const { clock, floors, revisions, resolver } = setup();
    const revision = await resolver.write(
      PAGE,
      { windowDays: 20 },
      { scope: ACME },
      { ...LIVE, effectiveAt: new Date("2026-11-01T00:00:00.000Z") },
    );
    floors.seed("returns", [{ ...FLOOR, value: 28 }]);
    clock.at = new Date("2026-11-02T00:00:00.000Z");
    await expect(resolver.applyDue()).rejects.toBeInstanceOf(AggregateError);
    await expect(revisions.find(revision.id)).resolves.toMatchObject({
      status: SettingRevisionStatus.Scheduled,
    });
  });

  it("applies a change set with removals and locks, and records it", async () => {
    const { values, resolver } = setup();
    await values.write("returns", { scope: ACME }, { mode: "credit", guestRefunds: true });
    const revision = await resolver.applyChange(
      "returns",
      { scope: ACME },
      { values: { windowDays: 30 }, removed: ["mode"], locked: ["windowDays"] },
      LIVE,
    );
    expect(revision).toMatchObject({
      status: SettingRevisionStatus.Applied,
      removed: ["mode"],
      locked: ["windowDays"],
      previous: { mode: "credit" },
    });
    await expect(values.layers("returns", { scope: ACME })).resolves.toEqual([
      {
        values: { guestRefunds: true, windowDays: 30 },
        locked: ["windowDays"],
        holder: "platform.acme",
      },
    ]);
  });
});
