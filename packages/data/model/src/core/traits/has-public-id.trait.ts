/**
 * Stackra file contract:
 * Purpose: `HasPublicId(prefix)`, the trait that gives a model its primary key: `id`, a public id with the model's
 *          registered prefix, minted when the row is created (`ord_01jab3k4…`).
 * Boundary: the id is the field's initializer, so `em.create`, a factory and `CrudService` get a fresh id while a
 *           loaded row keeps its stored one (the ORM never runs the constructor of a loaded row). Database ids never
 *           leave a service, and there is no second id column. Gen maps `id` to the primary key.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (format and prefixes); ADR 0082; ADR 0096 (`Has*`: the model owns data); ADR 0294
 *                     (decision 27).
 */
import type { PublicId } from "@stackra/contracts";

import { createTrait } from "#core/functions/create-trait.function";
import { mintPublicId } from "#core/functions/mint-public-id.function";
import type { Trait } from "#core/types/trait.type";

/** A registered prefix: 2 to 6 lowercase letters. */
const PREFIX = /^[a-z]{2,6}$/;

/**
 * The public-id trait with `prefix`.
 *
 * @param prefix - the model's prefix, 2 to 6 lowercase letters, registered once in the manifest.
 * @throws TypeError when `prefix` is not 2 to 6 lowercase letters.
 * @example
 * export class Order extends Model.with(HasPublicId("ord")) {}
 * order.id; // PublicId<"ord">
 */
export function HasPublicId<const P extends string>(prefix: P): Trait<{ id: PublicId<P> }> {
  if (!PREFIX.test(prefix))
    throw new TypeError(`"${prefix}" is not a public id prefix: 2 to 6 lowercase letters`);
  return createTrait(
    "has_public_id",
    (base) =>
      class extends base {
        /** The record's public id; the primary key. */
        id: PublicId<P> = mintPublicId(prefix);
      },
    { prefix },
  );
}
