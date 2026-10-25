/**
 * Stackra file contract:
 * Purpose: `deriveShape`, the one runtime behind `PickType`, `OmitType`, `PartialType` and `Page.of`: a fresh, named
 *          `Schema` subclass whose kind record keeps how it was derived.
 * Boundary: the class carries no fields and no schema: gen compiles the derived fields from source and registers the
 *           schema of the author's subclass, as for any shape. Each call returns its own class. Internal: not exported
 *           from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 25 and 26; amendment item 13).
 */
import { registerKind } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { Schema } from "#core/bases/schema.base";

/**
 * A new shape class named `name`, of kind `schema` with `options` as its kind options.
 *
 * @example
 * deriveShape("PickType(CreateOrderInput)", { base: CreateOrderInput, pick: ["lines"] });
 */
export function deriveShape(
  name: string,
  options: Readonly<Record<string, unknown>>,
): AnyClass<Schema> {
  const Derived = class extends Schema {};
  Object.defineProperty(Derived, "name", { value: name });
  registerKind(Derived, "schema", options);
  return Derived;
}
