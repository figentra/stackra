/**
 * Stackra file contract:
 * Purpose: `HasEncryptedFields([options,] ...fields)`, the trait that names the string fields of a model that rest
 *          encrypted: the table holds only their sealed form, and the model holds their plain text in memory. With
 *          `{ subject }`, each row's fields are sealed under the key of the data subject that property names, so
 *          erasing the subject crypto-shreds them (`ErasureMethod.Shred` of @stackra/privacy needs this).
 * Boundary: adds no field (the model declares each field itself, typed `string` or `string | null`; a subject-sealed
 *           field reads as null once its subject is erased); it records the field names, and the subject property
 *           when given, in the trait registry, which `encryptedFieldsOf` and `encryptedSubjectOf` read. Sealing and
 *           opening are `EncryptedFieldsSubscriber`'s, through the `FieldCipher` port, or the `SubjectCipherResolver`
 *           port for a subject-sealed model. An encrypted field cannot be searched, sorted or indexed by its value.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decisions 1 and 4); ADR 0294 (decision 27); ADR 0188 (decision 2); ADR 0212; registry
 *                     gap R-36 (owner decision 23); gap gov2 (stackra-263).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { EncryptedFieldsOptions } from "#core/types/encrypted-fields-options.type";
import type { Trait } from "#core/types/trait.type";

/**
 * The encrypted-fields trait over `fields`, sealed under the scope's key.
 *
 * @param fields - the names of the model's string fields that rest encrypted, at least one, each once.
 * @throws TypeError when `fields` is empty or names a field twice.
 * @example
 * export class Contact extends Model.with(HasPublicId("con"), HasEncryptedFields("email", "phone")) {}
 */
export function HasEncryptedFields(...fields: readonly string[]): Trait;

/**
 * The encrypted-fields trait over `fields`, each row sealed under the key of the subject `options.subject` names.
 *
 * @param options - `subject`, the property holding the subject's public id.
 * @param fields - the names of the model's string fields that rest encrypted, at least one, each once.
 * @throws TypeError when `fields` is empty, names a field twice or names the subject property, or the subject is empty.
 * @example
 * export class Contact extends Model.with(HasPublicId("con"), HasEncryptedFields({ subject: "userId" }, "email")) {
 *   @Str({ max: 64 })
 *   userId!: string;
 *
 *   email: string | null = null;
 * }
 */
export function HasEncryptedFields(
  options: EncryptedFieldsOptions,
  ...fields: readonly string[]
): Trait;

/** Builds the encrypted-fields trait from either overload's arguments, documented above. */
export function HasEncryptedFields(...args: readonly (EncryptedFieldsOptions | string)[]): Trait {
  const [first] = args;
  const options = typeof first === "object" ? first : undefined;
  const fields = (options === undefined ? args : args.slice(1)) as readonly string[];
  if (fields.length === 0) throw new TypeError("HasEncryptedFields needs at least one field");
  if (new Set(fields).size !== fields.length)
    throw new TypeError(`HasEncryptedFields names a field twice: ${fields.join(", ")}`);
  if (options === undefined)
    return createTrait("has_encrypted_fields", (base) => class extends base {}, {
      fields: Object.freeze([...fields]),
    });
  const { subject } = options;
  if (typeof subject !== "string" || subject === "")
    throw new TypeError(
      "HasEncryptedFields({ subject }) names the property holding the subject's id",
    );
  if (fields.includes(subject))
    throw new TypeError(
      `HasEncryptedFields cannot encrypt ${subject}: it names the subject the other fields are sealed for`,
    );
  return createTrait("has_encrypted_fields", (base) => class extends base {}, {
    fields: Object.freeze([...fields]),
    subject,
  });
}
