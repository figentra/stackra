/**
 * Stackra file contract:
 * Purpose: `FlagRef<K>`, the typed reference to one flag a route, a menu or a component names
 *          (`Flags.web.help_centre`): its key, its declared default, scopes, expiry and removal issue, and its label.
 * Boundary: a type only; refs are built by `flagRefs` in the generated `#stackra/flags`. A ref carries declared
 *           metadata, never a value: values come from the `FlagProvider` through the `FlagReader`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: the key `<module>.<snake(class minus suffix)>`); ADR 0307 (decision 25).
 */
import type { FlagScope } from "#core/types/flag-scope.type";

/** A reference to the flag keyed `K`. */
export interface FlagRef<K extends string = string> {
  /** The flag key, `<module>.<name>` (`web.help_centre`). */
  readonly key: K;

  /** The declared default. */
  readonly default: boolean;

  /** The scopes the flag may be set at. */
  readonly scopes: readonly FlagScope[];

  /** The last day the flag may live, `YYYY-MM-DD`; `null` for a release switch. */
  readonly expires: string | null;

  /** The issue that removes the flag; `null` when none is named. */
  readonly removalIssue: string | null;

  /** The i18n key of its label (`web::flags.help_centre.label`). */
  readonly label: string;
}
