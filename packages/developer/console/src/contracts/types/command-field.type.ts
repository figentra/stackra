/**
 * Stackra file contract:
 * Purpose: `CommandField`, one argument or option of a command as `readCommand` reads it: the field it fills, its
 *          flag, its role, its value kind, whether it is required, its default and its bounds.
 * Boundary: a type only; serialisable, built once per class.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-002 to FR-005.
 */
import type { ValueKind } from "#contracts/types/value-kind.type";

/** One argument or option. */
export interface CommandField {
  /** The class field the parsed value is assigned to (`dryRun`). */
  readonly property: string;

  /** The command-line name: the field in kebab case (`dry-run`). */
  readonly flag: string;

  /** Positional, or named. */
  readonly role: "argument" | "option";

  /** The kind of each value. */
  readonly kind: ValueKind;

  /** The field holds a list (`@List`): a repeated option, or the last argument taking every remaining token. */
  readonly list: boolean;

  /** An argument that must be given. Options are never required. */
  readonly required: boolean;

  /** The field's initial value, when it has one. */
  readonly default?: unknown;

  /** The one-letter alias of an option. */
  readonly short?: string;

  /** Shown in the help. */
  readonly description?: string;

  /** The smallest number, or the shortest string or list. */
  readonly min?: number;

  /** The largest number, or the longest string or list. */
  readonly max?: number;

  /** The source of the pattern a string must match (`@Str({ pattern })`). */
  readonly pattern?: string;

  /** The value is never kept in an audit entry. */
  readonly secret?: boolean;

  /** The question asked when the invocation leaves the field out and the run is interactive. */
  readonly prompt?: string;

  /** The only values it takes. */
  readonly choices?: readonly string[];
}
