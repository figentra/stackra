/**
 * Stackra file contract:
 * Purpose: `SettingsPromotableDriver`, settings as a `Promotable` kind: it exports what a scope node itself holds of
 *          every registered settings group, diffs a sandbox snapshot against live with the live content hash, and
 *          applies a reviewed diff to live after checking live has not moved.
 * Boundary: the snapshot is a `SettingsPack` and is parsed with `SettingsPack$`; the diff rows are parsed again with
 *           `SettingsChange$` before apply. A setting is never a secret (ADR 0307 rule 23), so nothing here can copy a
 *           key. Live writes go through `SettingsPackService`, so floors and locks hold and each group gets an applied
 *           revision authored by the approver. The groups are the modules `settingKeys` registered in this process.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 6 and 7); ADR 0280 (decisions 1, 2 and 4); ADR 0213 (decision 4).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { contentHash } from "@stackra/market-packs";

import { Promotable, SettingEnvironment } from "#contracts/index";
import type { PromotionDiff, SettingsPack } from "#contracts/index";
import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";
import { SETTINGS_CHANGE_SCHEMA } from "#core/constants/settings-change-schema.constant";
import { SETTINGS_PACK_SCHEMA } from "#core/constants/settings-pack-schema.constant";
import { PromotionBaseStaleError } from "#core/errors/promotion-base-stale.error";
import { diffSettingsPacks } from "#core/functions/diff-settings-packs.function";
import { SettingsPackService } from "#core/services/settings-pack.service";

/**
 * The settings kind of a promotion.
 *
 * @example
 * const diff = await settings.diff(live, await settings.export(sandbox));
 * await settings.apply(live, diff, approver);
 */
export class SettingsPromotableDriver extends Driver(Promotable) {
  /** See `Promotable.kind`. */
  readonly kind = "settings";

  /** The packs over the store. */
  private readonly packs: SettingsPackService;

  /** @param packs - the settings pack service. */
  constructor(packs: SettingsPackService) {
    super();
    this.packs = packs;
  }

  /** See `Promotable.export`. */
  async export(scope: ScopeRef): Promise<SettingsPack> {
    return this.packs.exportPack({ scope }, [...SETTING_KEY_REGISTRY.keys()]);
  }

  /** See `Promotable.diff`. */
  async diff(live: ScopeRef, next: unknown): Promise<PromotionDiff> {
    const pack = SETTINGS_PACK_SCHEMA.parse(next);
    const current = await this.export(live);
    return {
      kind: this.kind,
      base: await contentHash(current),
      changes: diffSettingsPacks(current, pack),
    };
  }

  /** See `Promotable.apply`. */
  async apply(live: ScopeRef, diff: PromotionDiff, approver: string): Promise<void> {
    if (diff.kind !== this.kind)
      throw new TypeError(`A ${diff.kind} diff cannot be applied by the ${this.kind} kind`);
    const changes = diff.changes.map((row) => SETTINGS_CHANGE_SCHEMA.parse(row));
    const hash = await contentHash(await this.export(live));
    if (hash !== diff.base)
      throw PromotionBaseStaleError.create({ promotable: this.kind, base: diff.base, live: hash });
    await this.packs.applyChanges({ scope: live }, changes, {
      author: approver,
      environment: SettingEnvironment.Live,
    });
  }
}
