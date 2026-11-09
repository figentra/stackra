/**
 * Stackra file contract:
 * Purpose: `EnvRow`, a manifest `env` row (gen, ADR 0173 amendment 2026-11-04) as far as runway's value check reads
 *          it: the name, type, enum values, whether it is required, the validation rules and the refused prefixes.
 * Boundary: type only; names and rules, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 2); STA-2104.
 */

/** A manifest `env` row, as far as the check reads it. */
export type EnvRow = {
  /** The variable name, in SCREAMING_SNAKE. */
  readonly name: string;

  /** The declared value type (`string`, `number`, `boolean`, `url`, `enum`). */
  readonly type?: string;

  /** The allowed values of an `enum` row. */
  readonly values?: readonly string[];

  /** Whether the environment must hold a value. */
  readonly required?: boolean;

  /** The validation rules a value must pass, each with its options. */
  readonly rules?: readonly { readonly name: string; readonly options?: unknown }[];

  /** The value prefixes refused per environment (a test key in production). */
  readonly refuse?: Readonly<Record<string, readonly string[]>>;
};
