/**
 * Stackra file contract:
 * Purpose: `FieldIR`, one data field of a shape class as the shape compiler read it: its name, its type, whether it
 *          is optional or nullable, its rules, its default and its `@Classified` class.
 * Boundary: a type only. Relations (model fields with a relation decorator) are not fields here: they belong to the
 *           entity emitter of the data wave.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0134 (classification).
 */
import type { FieldDefault } from "#core/types/field-default.type";
import type { FieldRule } from "#core/types/field-rule.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** One shape field. */
export interface FieldIR {
  /** The property name. */
  readonly name: string;

  /** Declared with `?:`, compiled to `.exactOptional()`. */
  readonly optional: boolean;

  /** The type includes `| null`. */
  readonly nullable: boolean;

  /** The field type. */
  readonly type: TypeDesc;

  /** The constraint decorators, in source order. */
  readonly rules: readonly FieldRule[];

  /** The constant default of the most derived initializer, when there is one. */
  readonly default?: FieldDefault;

  /** The previous field name `@Renamed(old)` records, when the field was renamed. */
  readonly renamed?: string;

  /** The `DataClassification` code `@Classified(...)` gives the field (`personal`), when it has one (stackra-262). */
  readonly classified?: string;

  /** `@Hidden`: the field never goes out on the wire, so `X$` and the manifest's JSON Schema leave it out (stackra-260). */
  readonly hidden?: true;
}
