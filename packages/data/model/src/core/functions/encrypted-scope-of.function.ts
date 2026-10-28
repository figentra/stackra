/**
 * Stackra file contract:
 * Purpose: `encryptedScopeOf`, which reads the scope property a model gives `HasEncryptedFields({ scope })`, so
 *          `EncryptedFieldsSubscriber` and `EncryptedFieldsResealService` bind each value to the scope that owns its
 *          row.
 * Boundary: reads the trait registry through `traitsOf`; never instantiates the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (consequence: the trait registry); ADR 0476; gap gov8 (stackra-330).
 */
import { traitsOf } from "#core/functions/traits-of.function";

/**
 * The scope property of `type`'s encrypted fields.
 *
 * @returns the property given as `HasEncryptedFields({ scope })`; undefined for a model whose values are bound to the
 *          field only, or without the trait.
 * @example
 * encryptedScopeOf(Message); // "tenantId"
 */
export function encryptedScopeOf(type: object): string | undefined {
  const trait = traitsOf(type).find((record) => record.name === "has_encrypted_fields");
  return trait?.options["scope"] as string | undefined;
}
