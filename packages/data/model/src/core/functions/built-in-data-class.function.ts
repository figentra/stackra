/**
 * Stackra file contract:
 * Purpose: `builtInDataClass`, the data class a `@Classified(DataClassification.X)` field carries: key `x` and the
 *          effects of row `x` of @stackra/contracts' `DATA_CLASSIFICATION_EFFECTS`.
 * Boundary: pure; one frozen object per code, made once. The table is the one source: this function restates nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 2: `@Classified` is a built-in data class); ADR 0134 (decision 2).
 */
import { DATA_CLASSIFICATION_EFFECTS } from "@stackra/contracts";
import type { DataClassification } from "@stackra/contracts";

import type { DataClassOptions } from "#core/types/data-class-options.type";

/** Made classes, per code. */
const MADE = new Map<DataClassification, DataClassOptions>();

/**
 * The built-in data class of `code`.
 *
 * @throws RangeError when `code` is not a `DataClassification`.
 * @example
 * builtInDataClass(DataClassification.Health).encrypt; // "sealed"
 */
export function builtInDataClass(code: DataClassification): DataClassOptions {
  const made = MADE.get(code);
  if (made !== undefined) return made;
  if (!Object.hasOwn(DATA_CLASSIFICATION_EFFECTS, code))
    throw new RangeError(`${JSON.stringify(code)} is not a DataClassification`);
  const dataClass = Object.freeze({
    key: code,
    ...DATA_CLASSIFICATION_EFFECTS[code],
  }) as DataClassOptions;
  MADE.set(code, dataClass);
  return dataClass;
}
