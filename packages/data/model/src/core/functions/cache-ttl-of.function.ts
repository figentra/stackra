/**
 * Stackra file contract:
 * Purpose: `cacheTtlOf`, which reads a model's `Cached` trait for @stackra/database's `CrudService`: how long a row
 *          read by its id stays in the entity cache.
 * Boundary: reads the trait registry; never instantiates the model. Refuses a model that is both `Cached` and
 *           `HasEncryptedFields`, because the cache would hold the decrypted values.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 5); ADR 0096 (consequence: the trait registry); data-layer gap ca5.
 */
import type { Duration } from "@stackra/contracts";

import { encryptedFieldsOf } from "#core/functions/encrypted-fields-of.function";
import { traitsOf } from "#core/functions/traits-of.function";

/**
 * The entity cache lifetime of `type`.
 *
 * @returns undefined for a model without `Cached`.
 * @throws TypeError when the model is `Cached` and has encrypted fields.
 * @example
 * cacheTtlOf(Product); // "PT10M"
 */
export function cacheTtlOf(type: object): Duration | undefined {
  const trait = traitsOf(type).find((record) => record.name === "cached");
  if (trait === undefined) return undefined;
  if (encryptedFieldsOf(type).length > 0)
    throw new TypeError(
      `${(type as { name?: string }).name ?? "A model"} is Cached and has encrypted fields; a shared cache would hold their plaintext`,
    );
  return trait.options["ttl"] as Duration;
}
