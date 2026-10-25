/**
 * Stackra file contract:
 * Purpose: `encryptedFieldsOf`, which reads the fields a model names with `HasEncryptedFields`, so
 *          `EncryptedFieldsSubscriber` knows what to seal and open and gen can check each is a string field.
 * Boundary: reads the trait registry through `traitsOf`; never instantiates the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (consequence: the trait registry); registry gap R-36 (owner decision 23).
 */
import { traitsOf } from "#core/functions/traits-of.function";

/**
 * The encrypted fields of `type`.
 *
 * @returns the names given to `HasEncryptedFields`, in order; empty for a model without the trait.
 * @example
 * encryptedFieldsOf(Contact); // ["email", "phone"]
 */
export function encryptedFieldsOf(type: object): readonly string[] {
  const trait = traitsOf(type).find((record) => record.name === "has_encrypted_fields");
  return (trait?.options["fields"] as readonly string[] | undefined) ?? [];
}
