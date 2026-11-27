/**
 * Stackra file contract:
 * Purpose: `FieldDataClass`, a model field's effective data class as gen reads it: the class key and its eight effects.
 * Boundary: a type only; `fieldDataClassOf` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 4).
 */
import type { DataClassEffects } from "@stackra/contracts";

/** A field's effective class. */
export interface FieldDataClass {
  /** The `@Classify` class's key, else the `@Classified` code. */
  readonly key: string;

  /** The effects every reader applies. */
  readonly effects: DataClassEffects;
}
