/**
 * Stackra file contract:
 * Purpose: the `Promotable` port: one configuration kind that moves from a sandbox to live by promotion: it exports a
 *          snapshot at a scope, diffs a snapshot against live, and applies a reviewed diff to live. The OS tenancy
 *          promotion collects one driver per kind (settings ships `SettingsPromotableDriver`); a kind's owner writes
 *          its own.
 * Boundary: an abstract class that is its own token, keyed `settings.Promotable` (homed here by the 2026-10-25
 *           package-needs conflict note; ADR 0359 decision 6). A snapshot is the kind's JSON and is untrusted input to
 *           `diff`, which validates it. `apply` refuses with `PromotionBaseStaleError` when live no longer hashes to
 *           the diff's base, and never copies a key or secret (ADR 0280 decision 2). Approval, step-up and the
 *           promotion record are the OS action's.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 6 and 7); ADR 0280 (decisions 1, 2 and 4); ADR 0263 (ports by type).
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
   * The change from live at `live` to `next`, against live's current content hash.
   *
   * @throws ZodError when `next` is not a snapshot of this kind.
   */
  abstract diff(live: ScopeRef, next: unknown): Promise<PromotionDiff>;

  /**
   * Applies `diff` to live at `live`, recorded as made by `approver` (the named human who approved the promotion).
   *
   * @throws PromotionBaseStaleError when live changed since the diff was computed; nothing is applied.
   */
  abstract apply(live: ScopeRef, diff: PromotionDiff, approver: string): Promise<void>;
}
