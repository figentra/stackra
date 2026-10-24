/**
 * Stackra file contract:
 * Purpose: `Schema`, the kind base of a shape: a class whose field types are its rules, whose initializers are its
 *          defaults and whose field decorators refine it; gen compiles each to one zod schema (`X$`). `X.create(...)`
 *          builds one through that schema.
 * Boundary: a bare-only kind base, registered as `schema`; it assigns nothing in its constructor and keeps no state
 *           (ADR 0294 decision 25). Its `~kind` brand is protected and type-only, so it is not in `keyof`: `Fields<X>`,
 *           `X$Check` and object spreads ignore it, while another kind cannot stand in for a shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 16, 25 and 26; amendment item 13); ADR 0095 as amended; the STA-335
 *                     kind-base spike.
 */
import { registerKind } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { instantiate } from "#core/functions/instantiate.function";
import { schemaOf } from "#core/functions/schema-of.function";
import type { Fields } from "#core/types/fields.type";

/**
 * The base of every shape class: an input, an output, a view, an event payload, a block's props.
 *
 * @example
 * export class RedeemPointsInput extends Schema {
 *   memberId!: PublicId<"usr">;
 *
 *   @Int({ min: 1 })
 *   points!: number;
 * }
 *
 * const input = RedeemPointsInput.create({ memberId, points: 100 });
 */
export abstract class Schema {
  /** Type-only: never present at runtime. */
  declare protected readonly "~kind": "schema";

  /**
   * Builds an instance of the calling class from code-form values (a `Date`, a `Money`), applying the defaults of
   * its generated schema and checking every rule.
   *
   * @param values - the class's data fields.
   * @returns an instance of the calling class.
   * @throws TypeError when the calling class has no registered schema.
   * @throws ZodError when `values` break the schema.
   */
  static create<S extends Schema>(this: AnyClass<S>, values: Fields<S>): S {
    return instantiate(this, schemaOf(this).parse(values));
  }
}

registerKind(Schema, "schema");
