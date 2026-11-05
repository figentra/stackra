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
  readonly name: string;
  readonly type?: string;
  readonly values?: readonly string[];
  readonly required?: boolean;
  readonly rules?: readonly { readonly name: string; readonly options?: unknown }[];
  readonly refuse?: Readonly<Record<string, readonly string[]>>;
};
