/**
 * Stackra file contract:
 * Purpose: `encryptedLookupOf`, which reads the fields a model gives `HasEncryptedFields({ lookup })`, so
 *          `EncryptedFieldsSubscriber` writes their blind index, `whereEncrypted` refuses any other field and gen can
 *          check each `<field>Bidx` column.
 * Boundary: reads the trait registry through `traitsOf`; never instantiates the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (consequence: the trait registry); gap gov9 (stackra-313).
 */
import { traitsOf } from "#core/functions/traits-of.function";

/**
 * The lookup fields of `type`.
 *
 * @returns the names given as `HasEncryptedFields({ lookup })`, in order; empty when there are none.
 * @example
 * encryptedLookupOf(Lead); // ["email"]
 */
export function encryptedLookupOf(type: object): readonly string[] {
  const trait = traitsOf(type).find((record) => record.name === "has_encrypted_fields");
  return (trait?.options["lookup"] as readonly string[] | undefined) ?? [];
}
