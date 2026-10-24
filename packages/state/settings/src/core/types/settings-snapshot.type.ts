/**
 * Stackra file contract:
 * Purpose: `SettingsSnapshot`, what `SettingsReader#read(page)` returns for a form: each key's resolved value by field
 *          name, and the names a holder in the chain locks.
 * Boundary: a type only. A key no holder stores reads its default. A locked name is shown read-only; the store refuses
 *           a write to a name a holder above the target locks. A user's own layer never locks, so on a user page the
 *           list is exactly what the user cannot change.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: locks and provenance); ADR 0307 (rule 24).
 */
import type { SettingValue } from "#contracts/index";

/**
 * The resolved values of a page.
 *
 * @example
 * const { values, locked } = await settings.read(SettingsPages.orders, { scope });
 */
export interface SettingsSnapshot {
  /** Each key's value by field name. */
  readonly values: Readonly<Record<string, SettingValue>>;

  /** The field names a holder in the chain locks. */
  readonly locked: readonly string[];
}
