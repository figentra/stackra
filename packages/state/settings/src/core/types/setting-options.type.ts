/**
 * Stackra file contract:
 * Purpose: `SettingOptions`, what `@Setting({...})` takes on one field: the levels it narrows to, whether a holder may
 *          pin it for every holder below, whether a change waits for a second approver, and whether clients receive it.
 * Boundary: a type only. Every option is optional: a field without `@Setting` keeps its class's levels, is not
 *           lockable, needs no approval and stays on the server. Gen and the generated settings operations enforce
 *           the options; the decorator only records them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23); ADR 0213 (decision 5: approval).
 */
import type { SettingLevel } from "#core/types/setting-level.type";

/** The options of one setting field. */
export interface SettingOptions {
  /** The levels this field may be held at; a subset of its settings class's. */
  readonly scopes?: readonly SettingLevel[];

  /** Whether a holder may lock the value for every holder below it. */
  readonly lockable?: boolean;

  /** Whether a change waits for a second holder of `<module>.settings.approve`. */
  readonly approval?: boolean;

  /** Whether clients receive the resolved value in the area bootstrap. */
  readonly client?: boolean;
}
