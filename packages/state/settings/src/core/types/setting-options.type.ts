/**
 * Stackra file contract:
 * Purpose: `SettingOptions`, what `@Setting({...})` takes on one field: the levels it narrows to, whether a holder may
 *          pin it for every holder below, whether a change waits for a second approver, whether clients receive it,
 *          whether it is edited in place on live, whether normal mode shows it, and the market-pack key that floors it.
 * Boundary: a type only. Every option is optional: a field without `@Setting` keeps its class's levels, is not
 *           lockable, needs no approval and stays on the server. Gen and the generated settings operations enforce
 *           the options; the decorator only records them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23); ADR 0213 (decision 5: approval); ADR 0359 (decisions 1, 4 and 5:
 *                     live-editable and essential, declared per field); ADR 0370 (decision 6: floors).
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

  /** Whether it is an operational value edited in place on live; otherwise it changes in a sandbox and is promoted. */
  readonly live?: boolean;

  /** Whether normal mode shows it; developer mode shows every field. */
  readonly essential?: boolean;

  /** The market-pack key whose legal floor bounds it (`consumer.withdrawal_days`). */
  readonly floor?: string;
}
