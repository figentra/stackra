/**
 * Stackra file contract:
 * Purpose: `SettingsPackService`, settings packs over the store: export what one holder itself holds across groups,
 *          and apply a pack or a list of diff rows to a holder through `SettingsResolver#applyChange`, one applied
 *          revision per changed group. It backs `settings:diff`, `settings:apply`, product seed packs and promotion.
 * Boundary: a singleton service over the value store and the resolver. Export reads the target's own layer only (the
 *           holder `SettingLayer["holder"]` names), never inherited values, so a pack never copies a platform or
 *           product default into a tenant. Applying a pack considers the pack's groups only; a promotion passes diff
 *           rows computed over every group. Floors and locks apply on every write.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4); ADR 0280 (decisions 1 and 4); ADR 0359 (decision 6).
 */
import { Service } from "@stackra/container";

import type { SettingValueStore } from "#contracts/index";
import type { SettingLayer, SettingRevision, SettingTarget, SettingsPack } from "#contracts/index";
import { diffSettingsPacks } from "#core/functions/diff-settings-packs.function";
import { settingHolderOf } from "#core/functions/setting-holder-of.function";
import type { SettingsResolver } from "#core/services/settings-resolver.service";
import type { SettingWriteOptions } from "#core/types/setting-write-options.type";
import type { SettingsChange } from "#core/types/settings-change.type";

/**
 * Exports and applies settings packs.
 *
 * @example
 * const pack = await packs.exportPack({ scope: sandbox }, ["orders", "checkout"]);
 * await packs.applyPack({ scope: live }, pack, { author, environment: SettingEnvironment.Live });
 */
export class SettingsPackService extends Service {
  /** Where the values live. */
  private readonly store: SettingValueStore;

  /** The resolver that records each change. */
  private readonly resolver: SettingsResolver;

  /**
   * @param store - the selected value store.
   * @param resolver - the settings resolver.
   */
  constructor(store: SettingValueStore, resolver: SettingsResolver) {
    super();
    this.store = store;
    this.resolver = resolver;
  }

  /**
   * What `target`'s own holder stores of each of `groups`; a group it stores nothing of is left out.
   *
   * @throws TypeError when the store driver does not name the holder of its layers.
   */
  async exportPack(target: SettingTarget, groups: readonly string[]): Promise<SettingsPack> {
    const holder = settingHolderOf(target);
    const out: Record<string, SettingLayer> = {};
    for (const group of [...groups].sort()) {
      const layers = await this.store.layers(group, target);
      if (layers.some((layer) => layer.holder === undefined))
        throw new TypeError(
          "This settings store does not name the holder of its layers, so a pack cannot be exported",
        );
      const own = layers.find((layer) => layer.holder === holder);
      if (own !== undefined && Object.keys(own.values).length > 0)
        out[group] = { values: { ...own.values }, locked: [...own.locked].sort() };
    }
    return { groups: out };
  }

  /** Makes `target`'s own values of the pack's groups equal the pack, one applied revision per changed group. */
  async applyPack(
    target: SettingTarget,
    pack: SettingsPack,
    meta: Pick<SettingWriteOptions, "author" | "reason" | "environment">,
  ): Promise<readonly SettingRevision[]> {
    const current = await this.exportPack(target, Object.keys(pack.groups));
    return this.applyChanges(target, diffSettingsPacks(current, pack), meta);
  }

  /**
   * Applies diff rows to `target`'s own holder: an `after` is written (with its lock), a missing `after` removes the
   * path. One applied revision per group, in group order.
   *
   * @throws SettingBelowFloorError when a value crosses a legal floor; that group and the ones after it are not written.
   * @throws SettingsLockedError when a holder above the target locks a written path.
   */
  async applyChanges(
    target: SettingTarget,
    changes: readonly SettingsChange[],
    meta: Pick<SettingWriteOptions, "author" | "reason" | "environment">,
  ): Promise<readonly SettingRevision[]> {
    const revisions: SettingRevision[] = [];
    for (const group of [...new Set(changes.map((change) => change.group))].sort()) {
      const rows = changes.filter((change) => change.group === group);
      const written = rows.filter((row) => row.after !== undefined);
      revisions.push(
        await this.resolver.applyChange(
          group,
          target,
          {
            values: Object.fromEntries(written.map((row) => [row.path, row.after ?? null])),
            removed: rows.filter((row) => row.after === undefined).map((row) => row.path),
            locked: written.filter((row) => row.lockedAfter).map((row) => row.path),
          },
          meta,
        ),
      );
    }
    return revisions;
  }
}
