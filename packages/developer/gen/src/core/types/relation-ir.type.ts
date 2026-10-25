/**
 * Stackra file contract:
 * Purpose: `RelationIR`, one relation field of a model as discovery read it: its kind (from the relation decorator and
 *          the field type), its target model, whether it is a `Ref<T>`, nullable, the inverse side a one-to-many names
 *          and the decorator's constant options, which is what the entity emitter turns into an `EntitySchema`
 *          property.
 * Boundary: a type only. A `Link<T>` field is a `link`: a scalar column holding the target's public id, never a
 *           foreign key or a join (ADR 0294 decision 28).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R11 and decision 28: relations and links); ADR 0097 (decision 3: gen emits
 *                     EntitySchema).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** One relation of a model. */
export interface RelationIR {
  /** The field name. */
  readonly name: string;

  /** `m:1`, `1:m`, `m:n`, `1:1`, or `link` for a `Link<T>` column. */
  readonly kind: "m:1" | "1:m" | "m:n" | "1:1" | "link";

  /** The target model class. */
  readonly target: ClassRef;

  /** The module key of the target when it is a model of this member. */
  readonly targetModule?: string;

  /** The type includes `| null`. */
  readonly nullable: boolean;

  /** The field is typed `Ref<T>`. */
  readonly ref: boolean;

  /** The field of the target that points back (`(line) => line.order` names `order`). */
  readonly inverse?: string;

  /** The decorator's constant options (`onDelete`, `orphanRemoval`, `pivotTable`). */
  readonly options: Readonly<Record<string, unknown>>;
}
