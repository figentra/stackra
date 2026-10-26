/**
 * Stackra file contract:
 * Purpose: `SettingsResolver`, the settings-layer resolver: it reads a group through the cascade with the legal floors
 *          of the target's market pack (platform floor below product default, tenant and user), gives each key its
 *          provenance, and records every write as a revision: refused below a floor, refused on live for a key that
 *          is not live-editable (unless break-glass), held for a second approver when a key needs approval, scheduled
 *          when it takes effect later, applied otherwise. A key or value gated by an entitlement the holder lacks reads
 *          as its default (provenance `entitlement`) and is refused on every write (`entitlement_required`).
 * Boundary: a singleton service over five ports (values, floors, revisions, clock, entitlements), so it never knows
 *           where any of them live; with no entitlement source bound no gated key is unlocked (fail closed). A floor
 *           is applied at save time (refused) and at read time (lifted, and reported, so the admin can tell the
 *           holder). A write to a user's own layer is a person's preference and is live-editable. `applyChange` is the
 *           promotion and pack path: it skips the live and approval checks (the promotion action carries its own
 *           approval) but never the entitlements, the floors or the locks. IAM (who may write, approve or break glass)
 *           is the calling action's. `SettingsReader#get` lifts floors the same way (`liftFloors`).
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decisions 2 and 5); ADR 0359 (decisions 3 to 5 and 9); ADR 0395 (decision 1: one
 *                     code, `live_read_only`); ADR 0370 (decision 6); ADR
 *                     0363 (decision 4); config-model section 3; ADR 0420 (decisions 1 to 3).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { LiveReadOnlyError } from "@stackra/errors";
import { validate } from "@stackra/validation";

import { SettingEnvironment, SettingRevisionStatus, SettingSource } from "#contracts/index";
import type {
  SettingLayer,
  SettingRevision,
  SettingTarget,
  SettingValue,
  SettingEntitlementSource,
  SettingFloorSource,
  SettingRevisionStore,
  SettingValueStore,
} from "#contracts/index";
import type { Settings } from "#core/bases/settings.base";
import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";
import { SettingFourEyesError } from "#core/errors/setting-four-eyes.error";
import { SettingRevisionClosedError } from "#core/errors/setting-revision-closed.error";
import { crossesFloor } from "#core/functions/crosses-floor.function";
import { grantedSettingEntitlements } from "#core/functions/granted-setting-entitlements.function";
import { liftFloors } from "#core/functions/lift-floors.function";
import { mergeSettingLayers } from "#core/functions/merge-setting-layers.function";
import { nestSettingValues } from "#core/functions/nest-setting-values.function";
import { refuseBelowFloors } from "#core/functions/refuse-below-floors.function";
import { refuseUnentitledSettings } from "#core/functions/refuse-unentitled-settings.function";
import { settingPageChanges } from "#core/functions/setting-page-changes.function";
import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";
import { settingsKeyOf } from "#core/functions/settings-key-of.function";
import { unentitledSettingPaths } from "#core/functions/unentitled-setting-paths.function";
import type { ResolvedSetting } from "#core/types/resolved-setting.type";
import type { SettingChangeSet } from "#core/types/setting-change-set.type";
import type { SettingWriteOptions } from "#core/types/setting-write-options.type";
import type { SettingsPage } from "#core/types/settings-page.type";

/** The holder whose value of `path` the cascade keeps: the outermost locking holder, else the innermost storing one. */
function holderOfPath(layers: readonly SettingLayer[], path: string): string | null {
  let holder: string | null = null;
  for (const layer of layers) {
    if (Object.hasOwn(layer.values, path)) holder = layer.holder ?? null;
    if (layer.locked.includes(path)) return holder;
  }
  return holder;
}

/**
 * Resolves settings with floors and provenance, and records changes as revisions.
 *
 * @example
 * const orders = await this.resolver.get(OrdersSettings, { scope });
 * const page = await this.resolver.resolve(SettingsPages.orders, { scope });
 * await this.resolver.write(SettingsPages.orders, { refundWindowDays: 30 }, { scope }, { environment, author });
 */
export class SettingsResolver extends Service {
  /** Where the values live. */
  private readonly store: SettingValueStore;

  /** The market's legal floors. */
  private readonly floorSource: SettingFloorSource;

  /** Where the revisions live. */
  private readonly revisions: SettingRevisionStore;

  /** The one source of now. */
  private readonly clock: Clock;

  /** The holder's grants; none bound means no gated key is unlocked. */
  private readonly entitlements: SettingEntitlementSource | undefined;

  /**
   * @param store - the selected value store.
   * @param floorSource - the selected floor source.
   * @param revisions - the selected revision store.
   * @param clock - the clock.
   * @param entitlements - the selected entitlement source; gen's wiring always passes it.
   */
  constructor(
    store: SettingValueStore,
    floorSource: SettingFloorSource,
    revisions: SettingRevisionStore,
    clock: Clock,
    entitlements?: SettingEntitlementSource,
  ) {
    super();
    this.store = store;
    this.floorSource = floorSource;
    this.revisions = revisions;
    this.clock = clock;
    this.entitlements = entitlements;
  }

  /**
   * The resolved group of `type` at `target`, each floored field lifted to its floor when it crosses it (a default
   * included).
   *
   * @throws TypeError when `type` is not a settings class, or has no registered schema.
   * @throws ZodError when a stored value breaks the class's schema.
   */
  async get<S extends Settings>(type: AnyClass<S>, target: SettingTarget = {}): Promise<S> {
    const group = settingsKeyOf(type);
    const keys = SETTING_KEY_REGISTRY.get(group) ?? [];
    const [layers, floors, granted] = await Promise.all([
      this.store.layers(group, target),
      this.floorSource.floors(group, target),
      grantedSettingEntitlements(this.entitlements, keys, target),
    ]);
    const values = { ...mergeSettingLayers(layers).values };
    for (const path of unentitledSettingPaths(values, keys, granted)) delete values[path];
    const resolved = validate(type, nestSettingValues(values));
    if (!resolved.success) throw resolved.error;
    return liftFloors(resolved.data, floors);
  }

  /** Each key of `page` at `target` by field name, with its effective value, provenance, floor and lock. */
  async resolve(
    page: SettingsPage,
    target: SettingTarget = {},
  ): Promise<Readonly<Record<string, ResolvedSetting>>> {
    const [layers, floors, granted] = await Promise.all([
      this.store.layers(page.key, target),
      this.floorSource.floors(page.key, target),
      grantedSettingEntitlements(this.entitlements, page.fields, target),
    ]);
    const merged = mergeSettingLayers(layers);
    const gated = unentitledSettingPaths(merged.values, page.fields, granted);
    const out: Record<string, ResolvedSetting> = {};
    for (const key of page.fields) {
      const path = settingPathInGroup(key);
      const refused = gated.includes(path);
      const stored = Object.hasOwn(merged.values, path) && !refused;
      const value = stored ? (merged.values[path] ?? null) : key.default;
      const floor = floors.find((candidate) => candidate.path === path) ?? null;
      const lifted = floor !== null && crossesFloor(value, floor);
      out[key.name] = {
        value: lifted ? floor.value : value,
        source: lifted
          ? SettingSource.Floor
          : refused
            ? SettingSource.Entitlement
            : stored
              ? SettingSource.Layer
              : SettingSource.Default,
        holder: stored && !lifted ? holderOfPath(layers, path) : null,
        floor,
        locked: merged.locked.includes(path),
        live: key.live === true,
        essential: key.essential === true,
      };
    }
    return out;
  }

  /**
   * Records `values`, keyed by field name, of `page` at `target`'s own holder, and applies them unless they wait for
   * approval or a later effective time.
   *
   * @returns the revision: applied, pending (a written key needs approval) or scheduled.
   * @throws SettingValueInvalidError when a name is not a key of the page or its value breaks the key.
   * @throws TypeError when a break-glass change has no reason.
   * @throws LiveReadOnlyError (`live_read_only`, each refused path as a field error) when, on live and not break-glass,
   *         a written key is not live-editable.
   * @throws EntitlementRequiredError when a written key or value is gated by an entitlement the holder lacks.
   * @throws SettingBelowFloorError when a value crosses a legal floor.
   * @throws SettingsLockedError when a holder above the target locks a written key.
   */
  async write(
    page: SettingsPage,
    values: Readonly<Record<string, unknown>>,
    target: SettingTarget,
    options: SettingWriteOptions,
  ): Promise<SettingRevision> {
    const { changes, keys } = settingPageChanges(page, values);
    const breakGlass = options.breakGlass === true;
    if (breakGlass && (options.reason ?? "").trim() === "")
      throw new TypeError("A break-glass settings change needs a reason");
    if (
      options.environment === SettingEnvironment.Live &&
      !breakGlass &&
      target.user === undefined
    ) {
      const readOnly = keys.filter((key) => key.live !== true).map(settingPathInGroup);
      if (readOnly.length > 0)
        throw LiveReadOnlyError.create(
          {},
          { fieldErrors: Object.fromEntries(readOnly.map((path) => [path, "live_read_only"])) },
        );
    }
    refuseUnentitledSettings(
      changes,
      page.fields,
      await grantedSettingEntitlements(this.entitlements, page.fields, target),
    );
    refuseBelowFloors(changes, await this.floorSource.floors(page.key, target));
    const now = this.clock.now();
    const effectiveAt = options.effectiveAt ?? now;
    const status = keys.some((key) => key.approval === true)
      ? SettingRevisionStatus.Pending
      : effectiveAt > now
        ? SettingRevisionStatus.Scheduled
        : SettingRevisionStatus.Applied;
    const previous = await this.previousOf(page.key, target, Object.keys(changes));
    if (status === SettingRevisionStatus.Applied) await this.store.write(page.key, target, changes);
    return this.revisions.append({
      group: page.key,
      target,
      values: changes,
      removed: [],
      previous,
      author: options.author,
      reason: options.reason ?? null,
      environment: options.environment,
      breakGlass,
      status,
      effectiveAt: effectiveAt.toISOString(),
      createdAt: now.toISOString(),
      decidedBy: null,
      appliedAt: status === SettingRevisionStatus.Applied ? now.toISOString() : null,
    });
  }

  /**
   * Applies `change` to `group` at `target` now and records it, for a promotion or a pack apply. Floors and locks
   * apply; the live and approval checks are the promotion action's.
   *
   * @throws EntitlementRequiredError when a written key or value is gated by an entitlement the holder lacks.
   * @throws SettingBelowFloorError when a value crosses a legal floor; nothing is written.
   * @throws SettingsLockedError when a holder above the target locks a written key.
   */
  async applyChange(
    group: string,
    target: SettingTarget,
    change: SettingChangeSet,
    meta: Pick<SettingWriteOptions, "author" | "reason" | "environment">,
  ): Promise<SettingRevision> {
    const keys = SETTING_KEY_REGISTRY.get(group) ?? [];
    refuseUnentitledSettings(
      change.values,
      keys,
      await grantedSettingEntitlements(this.entitlements, keys, target),
    );
    refuseBelowFloors(change.values, await this.floorSource.floors(group, target));
    const previous = await this.previousOf(group, target, [
      ...Object.keys(change.values),
      ...change.removed,
    ]);
    await this.store.write(group, target, change.values, change.locked);
    if (change.removed.length > 0) await this.store.remove(group, target, change.removed);
    const now = this.clock.now().toISOString();
    return this.revisions.append({
      group,
      target,
      values: change.values,
      removed: change.removed,
      ...(change.locked === undefined ? {} : { locked: change.locked }),
      previous,
      author: meta.author,
      reason: meta.reason ?? null,
      environment: meta.environment,
      breakGlass: false,
      status: SettingRevisionStatus.Applied,
      effectiveAt: now,
      createdAt: now,
      decidedBy: null,
      appliedAt: now,
    });
  }

  /**
   * Approves pending revision `id` as `approver`: it applies now, or is scheduled when its time is later.
   *
   * @throws TypeError when there is no revision `id`.
   * @throws SettingRevisionClosedError when it is not pending.
   * @throws SettingFourEyesError when `approver` is its author.
   * @throws SettingBelowFloorError when a floor rose above a value since it was made.
   */
  async approve(id: string, approver: string): Promise<SettingRevision> {
    const revision = await this.revisionOf(id);
    if (revision.status !== SettingRevisionStatus.Pending)
      throw SettingRevisionClosedError.create({ revision: id, status: revision.status });
    if (revision.author === approver) throw SettingFourEyesError.create({ revision: id });
    if (Date.parse(revision.effectiveAt) > this.clock.now().getTime())
      return this.revisions.update(id, {
        status: SettingRevisionStatus.Scheduled,
        decidedBy: approver,
      });
    return this.applyRevision(revision, approver);
  }

  /**
   * Rejects pending or scheduled revision `id` as `by`; nothing of it is applied.
   *
   * @throws TypeError when there is no revision `id`.
   * @throws SettingRevisionClosedError when it already applied or was rejected.
   */
  async reject(id: string, by: string): Promise<SettingRevision> {
    const revision = await this.revisionOf(id);
    if (
      revision.status !== SettingRevisionStatus.Pending &&
      revision.status !== SettingRevisionStatus.Scheduled
    )
      throw SettingRevisionClosedError.create({ revision: id, status: revision.status });
    return this.revisions.update(id, { status: SettingRevisionStatus.Rejected, decidedBy: by });
  }

  /**
   * Applies every scheduled revision whose time has come, oldest first; the app's scheduler calls it. A revision that
   * fails (a floor or a lock now refuses it) stays scheduled and the others still apply.
   *
   * @returns the revisions applied.
   * @throws AggregateError after the run when any revision failed, carrying each failure.
   */
  async applyDue(): Promise<readonly SettingRevision[]> {
    const applied: SettingRevision[] = [];
    const failed: unknown[] = [];
    for (const revision of await this.revisions.due(this.clock.now().toISOString()))
      try {
        applied.push(await this.applyRevision(revision, revision.decidedBy));
      } catch (error) {
        failed.push(error);
      }
    if (failed.length > 0)
      throw new AggregateError(failed, `${failed.length} scheduled settings revision(s) failed`);
    return applied;
  }

  /** The revisions of `group` at exactly `target`'s holder, newest first. */
  async history(group: string, target: SettingTarget = {}): Promise<readonly SettingRevision[]> {
    return this.revisions.list(group, target);
  }

  /** Writes `revision`'s change to the store, rechecking entitlements and floors, and marks it applied. */
  private async applyRevision(
    revision: SettingRevision,
    decidedBy: string | null,
  ): Promise<SettingRevision> {
    const keys = SETTING_KEY_REGISTRY.get(revision.group) ?? [];
    refuseUnentitledSettings(
      revision.values,
      keys,
      await grantedSettingEntitlements(this.entitlements, keys, revision.target),
    );
    refuseBelowFloors(
      revision.values,
      await this.floorSource.floors(revision.group, revision.target),
    );
    await this.store.write(revision.group, revision.target, revision.values, revision.locked);
    if (revision.removed.length > 0)
      await this.store.remove(revision.group, revision.target, revision.removed);
    return this.revisions.update(revision.id, {
      status: SettingRevisionStatus.Applied,
      decidedBy,
      appliedAt: this.clock.now().toISOString(),
    });
  }

  /** The revision `id`. */
  private async revisionOf(id: string): Promise<SettingRevision> {
    const revision = await this.revisions.find(id);
    if (revision === null) throw new TypeError(`There is no settings revision ${id}`);
    return revision;
  }

  /** The resolved values of `paths` before a change (a path no holder stores is absent). */
  private async previousOf(
    group: string,
    target: SettingTarget,
    paths: readonly string[],
  ): Promise<Record<string, SettingValue>> {
    const { values } = mergeSettingLayers(await this.store.layers(group, target));
    return Object.fromEntries(
      paths
        .filter((path) => Object.hasOwn(values, path))
        .map((path) => [path, values[path] ?? null]),
    );
  }
}
