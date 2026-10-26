/**
 * Stackra file contract:
 * Purpose: `SettingsPromotableDriver`, settings as a `Promotable` kind: it exports what a scope node itself holds of
 *          every registered settings group, diffs a sandbox snapshot against live with the live content hash, the
 *          live snapshot and the sandbox's release, applies a reviewed diff to live after checking live has not moved
 *          and runs at least that release, and turns an applied diff into its rollback.
 * Boundary: the snapshot is a `SettingsPack` and is parsed with `SettingsPack$`; the diff rows are parsed again with
 *           `SettingsChange$` before apply. A setting is never a secret (ADR 0307 rule 23), so nothing here can copy a
 *           key. Live writes go through `SettingsPackService`, so floors and locks hold and each group gets an applied
 *           revision authored by the approver. The groups are the modules `settingKeys` registered in this process.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 6 to 8, open question 6); ADR 0395 (decisions 2 and 3); ADR 0280
 *                     (decisions 1, 2 and 4); ADR 0213 (decision 4).
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
import { PromotionReleaseTooOldError } from "#core/errors/promotion-release-too-old.error";
import { compareReleases } from "#core/functions/compare-releases.function";
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

  /**
   * See `Promotable.diff`.
   *
   * @throws TypeError when `release` is not a release.
   */
  async diff(
    live: ScopeRef,
    next: unknown,
    options: { readonly release?: string } = {},
  ): Promise<PromotionDiff> {
    const pack = SETTINGS_PACK_SCHEMA.parse(next);
    if (options.release !== undefined) compareReleases(options.release, options.release);
    const current = await this.export(live);
    return {
      kind: this.kind,
      base: await contentHash(current),
      changes: diffSettingsPacks(current, pack),
      previous: current,
      ...(options.release === undefined ? {} : { release: options.release }),
    };
  }

  /** See `Promotable.apply`. */
  async apply(
    live: ScopeRef,
    diff: PromotionDiff,
    approver: string,
    options: { readonly release?: string } = {},
  ): Promise<void> {
    if (diff.kind !== this.kind)
      throw new TypeError(`A ${diff.kind} diff cannot be applied by the ${this.kind} kind`);
    if (diff.release !== undefined) {
      if (options.release === undefined)
        throw new TypeError(
          `This change set needs release ${diff.release}: pass the release live runs to apply it`,
        );
      if (compareReleases(options.release, diff.release) < 0)
        throw PromotionReleaseTooOldError.create({
          promotable: this.kind,
          required: diff.release,
          live: options.release,
        });
    }
    const changes = diff.changes.map((row) => SETTINGS_CHANGE_SCHEMA.parse(row));
    const hash = await contentHash(await this.export(live));
    if (hash !== diff.base)
      throw PromotionBaseStaleError.create({ promotable: this.kind, base: diff.base, live: hash });
    await this.packs.applyChanges({ scope: live }, changes, {
      author: approver,
      environment: SettingEnvironment.Live,
    });
  }

  /** See `Promotable.rollbackOf`. */
  async rollbackOf(
    live: ScopeRef,
    applied: PromotionDiff,
    options: { readonly release?: string } = {},
  ): Promise<PromotionDiff> {
    if (applied.kind !== this.kind)
      throw new TypeError(`A ${applied.kind} diff cannot be rolled back by the ${this.kind} kind`);
    return this.diff(live, applied.previous, options);
  }
}
