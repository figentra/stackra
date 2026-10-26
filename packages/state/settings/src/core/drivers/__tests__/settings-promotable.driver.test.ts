/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsPromotableDriver`: it is a `Promotable` of kind `settings`; it exports a scope's own
 *          values of every registered group; a sandbox diff against live carries live's hash and the rows; apply
 *          brings live to the sandbox and records the approver; a stale base, another kind's diff and a snapshot that
 *          is not a pack are refused; a change set's minimum release is refused on an older live and required on
 *          apply; a rollback brings live back to the snapshot the promotion replaced.
 * Boundary: test only; memory drivers, a fixed clock and keys registered with `settingKeys`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decisions 6 to 8); ADR 0395 (decisions 2 and 3); ADR 0280
 *                     (decision 4).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { contentHash } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { Promotable } from "#contracts/index";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsPromotableDriver } from "#core/drivers/settings-promotable.driver";
import { SettingType } from "#core/enums/setting-type.enum";
import { PromotionBaseStaleError } from "#core/errors/promotion-base-stale.error";
import { PromotionReleaseTooOldError } from "#core/errors/promotion-release-too-old.error";
import { settingKeys } from "#core/functions/setting-keys.function";
import { SettingsPackService } from "#core/services/settings-pack.service";
import { SettingsResolver } from "#core/services/settings-resolver.service";

settingKeys({
  promo: {
    a: {
      type: SettingType.Integer,
      default: 0,
      scopes: ["platform"],
      label: "promo::settings.a.label" as I18nKey,
    },
  },
});

const LIVE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const SANDBOX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme_sandbox" };
const CLOCK = { now: () => new Date("2026-10-25T10:00:00.000Z") } as unknown as Clock;

/** The driver over one memory store, with its revisions. */
function setup() {
  const store = new MemorySettingValueStoreDriver();
  const revisions = new MemorySettingRevisionStoreDriver();
  const resolver = new SettingsResolver(
    store,
    new MemorySettingFloorSourceDriver(),
    revisions,
    CLOCK,
  );
  return {
    store,
    revisions,
    kind: new SettingsPromotableDriver(new SettingsPackService(store, resolver)),
  };
}

describe(SettingsPromotableDriver, () => {
  it("is the settings Promotable", () => {
    const { kind } = setup();
    expect(kind).toBeInstanceOf(Promotable);
    expect(kind.kind).toBe("settings");
  });

  it("diffs a sandbox against live and applies it, recording the approver", async () => {
    const { store, revisions, kind } = setup();
    await store.write("promo", { scope: LIVE }, { a: 1 });
    await store.write("promo", { scope: SANDBOX }, { a: 5 });
    const live = await kind.export(LIVE);
    const diff = await kind.diff(LIVE, await kind.export(SANDBOX));
    expect(diff).toEqual({
      kind: "settings",
      base: await contentHash(live),
      changes: [
        { group: "promo", path: "a", before: 1, after: 5, lockedBefore: false, lockedAfter: false },
      ],
      previous: live,
    });
    await kind.apply(LIVE, diff, "usr_owner");
    await expect(kind.export(LIVE)).resolves.toEqual(await kind.export(SANDBOX));
    const [revision] = await revisions.list("promo", { scope: LIVE });
    expect(revision).toMatchObject({ author: "usr_owner", environment: "live", values: { a: 5 } });
  });

  it("refuses a stale base, another kind's diff and a snapshot that is not a pack", async () => {
    const { store, kind } = setup();
    await store.write("promo", { scope: SANDBOX }, { a: 5 });
    const diff = await kind.diff(LIVE, await kind.export(SANDBOX));
    await store.write("promo", { scope: LIVE }, { a: 2 });
    await expect(kind.apply(LIVE, diff, "usr_owner")).rejects.toBeInstanceOf(
      PromotionBaseStaleError,
    );
    await expect(kind.apply(LIVE, { ...diff, kind: "webhooks" }, "usr_owner")).rejects.toThrow(
      TypeError,
    );
    await expect(
      kind.diff(LIVE, { groups: { promo: { values: { a: { b: 1 } } } } }),
    ).rejects.toThrow();
  });

  it("refuses a change set on a live release older than it needs, and needs live's release", async () => {
    const { store, kind } = setup();
    await store.write("promo", { scope: SANDBOX }, { a: 5 });
    const diff = await kind.diff(LIVE, await kind.export(SANDBOX), { release: "1.4.0" });
    expect(diff.release).toBe("1.4.0");
    await expect(kind.apply(LIVE, diff, "usr_owner")).rejects.toThrow(TypeError);
    const old = await kind
      .apply(LIVE, diff, "usr_owner", { release: "1.3.9" })
      .catch((error: unknown) => error);
    expect(old).toBeInstanceOf(PromotionReleaseTooOldError);
    expect((old as PromotionReleaseTooOldError).details).toEqual({
      promotable: "settings",
      required: "1.4.0",
      live: "1.3.9",
    });
    await kind.apply(LIVE, diff, "usr_owner", { release: "1.4.0" });
    await expect(kind.export(LIVE)).resolves.toEqual(await kind.export(SANDBOX));
  });

  it("rolls a promotion back by re-applying the live snapshot it replaced, as a new change set", async () => {
    const { store, kind } = setup();
    await store.write("promo", { scope: LIVE }, { a: 1 });
    await store.write("promo", { scope: SANDBOX }, { a: 5 });
    const before = await kind.export(LIVE);
    const promoted = await kind.diff(LIVE, await kind.export(SANDBOX));
    await kind.apply(LIVE, promoted, "usr_owner");
    const rollback = await kind.rollbackOf(LIVE, promoted);
    expect(rollback.changes).toEqual([
      { group: "promo", path: "a", before: 5, after: 1, lockedBefore: false, lockedAfter: false },
    ]);
    await kind.apply(LIVE, rollback, "usr_owner");
    await expect(kind.export(LIVE)).resolves.toEqual(before);
    await expect(kind.rollbackOf(LIVE, { ...promoted, kind: "webhooks" })).rejects.toThrow(
      TypeError,
    );
  });
});
