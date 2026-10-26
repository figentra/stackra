/**
 * Stackra file contract:
 * Purpose: the `Promotable` port: one configuration kind that moves from a sandbox to live by promotion: it exports a
 *          snapshot at a scope, diffs a snapshot against live, applies a reviewed diff to live, and turns an applied
 *          diff into its rollback: a new change set that re-applies the live snapshot the promotion replaced. The OS tenancy
 *          promotion collects one driver per kind (settings ships `SettingsPromotableDriver`); a kind's owner writes
 *          its own.
 * Boundary: an abstract class that is its own token, keyed `settings.Promotable` (homed here by the 2026-10-25
 *           package-needs conflict note; ADR 0359 decision 6). A snapshot is the kind's JSON and is untrusted input to
 *           `diff`, which validates it. `apply` refuses with `PromotionBaseStaleError` when live no longer hashes to
 *           the diff's base, with `PromotionReleaseTooOldError` when live runs an older release than the diff needs,
 *           and never copies a key or secret (ADR 0280 decision 2). A rollback goes through `apply` like any change
 *           set, so it is reviewed and approved at the same level (ADR 0359 decision 8). Approval, step-up and the
 *           promotion record are the OS action's.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 6 to 8, open question 6); ADR 0395 (decisions 2 and 3); ADR 0280 (decisions 1,
 *                     2 and 4); ADR 0263 (ports by type).
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import type { PromotionDiff } from "#contracts/types/promotion-diff.type";

/**
 * One promotable configuration kind.
 *
 * @example
 * const diff = await kind.diff(live, await kind.export(sandbox));
 * await kind.apply(live, diff, approver);
 */
export abstract class Promotable extends Port {
  /** Type-only port key, so `DriverName<Promotable>` narrows to this port's drivers. */
  declare readonly "~key": "settings.Promotable";

  /** The kind's key (`settings`), as the promotion record names it. */
  abstract readonly kind: string;

  /** The kind's snapshot at `scope`: what the holder at that node itself holds. */
  abstract export(scope: ScopeRef): Promise<unknown>;

  /**
   * The change from live at `live` to `next`, against live's current content hash, needing at least `release` (the
   * platform release the sandbox runs) when one is given.
   *
   * @throws ZodError when `next` is not a snapshot of this kind.
   */
  abstract diff(
    live: ScopeRef,
    next: unknown,
    options?: { readonly release?: string },
  ): Promise<PromotionDiff>;

  /**
   * Applies `diff` to live at `live`, recorded as made by `approver` (the named human who approved the promotion).
   * `release` is the platform release live runs; it is required when the diff names one.
   *
   * @throws PromotionBaseStaleError when live changed since the diff was computed; nothing is applied.
   * @throws PromotionReleaseTooOldError when live runs an older release than the diff needs; nothing is applied.
   * @throws TypeError when the diff needs a release and none is given for live.
   */
  abstract apply(
    live: ScopeRef,
    diff: PromotionDiff,
    approver: string,
    options?: { readonly release?: string },
  ): Promise<void>;

  /**
   * The rollback of `applied`, a diff already applied to live at `live`: a new change set, computed against live now,
   * that brings live back to the snapshot `applied` replaced. It is applied with `apply`, reviewed like any change.
   *
   * @throws TypeError when `applied` is another kind's diff.
   */
  abstract rollbackOf(
    live: ScopeRef,
    applied: PromotionDiff,
    options?: { readonly release?: string },
  ): Promise<PromotionDiff>;
}
