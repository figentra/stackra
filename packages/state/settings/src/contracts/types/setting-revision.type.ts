/**
 * Stackra file contract:
 * Purpose: `SettingRevision`, one recorded change to one holder's values of one group: what it sets, removes and
 *          locks, the values it replaces, who made and decided it, where it lands, when it takes effect and its state.
 * Boundary: a type only; times are ISO-8601 instants. `previous` holds the resolved values of the changed paths before
 *           the change (a path no holder stored is absent), so a history can show "from → to". `locked` undefined
 *           keeps each written path's lock, as `SettingValueStore#write` does.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5); ADR 0359 (decisions 4 and 9: revisions and audit, break-glass).
 */
import type { SettingEnvironment } from "#contracts/enums/setting-environment.enum";
import type { SettingRevisionStatus } from "#contracts/enums/setting-revision-status.enum";
import type { SettingTarget } from "#contracts/types/setting-target.type";
import type { SettingValue } from "#contracts/types/setting-value.type";

/**
 * One revision of a settings group.
 *
 * @example
 * const pending = (await revisions.list("orders", { scope })).filter((r) => r.status === SettingRevisionStatus.Pending);
 */
export interface SettingRevision {
  /** Its id, given by the store. */
  readonly id: string;

  /** The group it changes. */
  readonly group: string;

  /** The holder it changes. */
  readonly target: SettingTarget;

  /** The values it sets, by path in the group. */
  readonly values: Readonly<Record<string, SettingValue>>;

  /** The paths whose stored value it removes, so they inherit again. */
  readonly removed: readonly string[];

  /** The written paths it locks; undefined keeps each written path's lock. */
  readonly locked?: readonly string[];

  /** The resolved values of the changed paths before it. */
  readonly previous: Readonly<Record<string, SettingValue>>;

  /** Who made it: a principal's public id. */
  readonly author: string;

  /** Why, as the author wrote it; required for a break-glass change. */
  readonly reason: string | null;

  /** Where it lands. */
  readonly environment: SettingEnvironment;

  /** Whether it changed live configuration outside promotion (ADR 0359 decision 9). */
  readonly breakGlass: boolean;

  /** Where the revision stands. */
  readonly status: SettingRevisionStatus;

  /** When it takes effect. */
  readonly effectiveAt: string;

  /** When it was made. */
  readonly createdAt: string;

  /** Who approved or rejected it; null until then, or when it needed no approval. */
  readonly decidedBy: string | null;

  /** When it applied; null until then. */
  readonly appliedAt: string | null;
}
