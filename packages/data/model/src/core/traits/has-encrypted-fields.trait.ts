/**
 * Stackra file contract:
 * Purpose: `HasEncryptedFields(...fields)`, the trait that names the string fields of a model that rest encrypted:
 *          the table holds only their sealed form, and the model holds their plain text in memory.
 * Boundary: adds no field (the model declares each field itself, typed `string` or `string | null`); it records the
 *           field names in the trait registry, which `encryptedFieldsOf` reads. Sealing and opening are
 *           `EncryptedFieldsSubscriber`'s, through the `FieldCipher` port. An encrypted field cannot be searched,
 *           sorted or indexed by its value.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decisions 1 and 4); ADR 0294 (decision 27); registry gap R-36 (owner decision 23).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The encrypted-fields trait over `fields`.
 *
 * @param fields - the names of the model's string fields that rest encrypted, at least one, each once.
 * @throws TypeError when `fields` is empty or names a field twice.
 * @example
 * export class Contact extends Model.with(HasPublicId("con"), HasEncryptedFields("email", "phone")) {
 *   @Str({ max: 320 })
 *   email!: string;
 *
 *   phone: string | null = null;
 * }
 */
export function HasEncryptedFields(...fields: readonly string[]): Trait {
  if (fields.length === 0) throw new TypeError("HasEncryptedFields needs at least one field");
  if (new Set(fields).size !== fields.length)
    throw new TypeError(`HasEncryptedFields names a field twice: ${fields.join(", ")}`);
  return createTrait("has_encrypted_fields", (base) => class extends base {}, {
    fields: Object.freeze([...fields]),
  });
}
