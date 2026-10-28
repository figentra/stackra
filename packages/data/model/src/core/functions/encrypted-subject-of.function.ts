/**
 * Stackra file contract:
 * Purpose: `encryptedSubjectOf`, which reads the subject property a model gives `HasEncryptedFields({ subject })`, so
 *          `EncryptedFieldsSubscriber` seals each row under its subject's key and @stackra/privacy can check that a
 *          shredded field really is subject-sealed.
 * Boundary: reads the trait registry through `traitsOf`; never instantiates the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (consequence: the trait registry); ADR 0212; gap gov2 (stackra-263).
 */
import { traitsOf } from "#core/functions/traits-of.function";

/**
 * The subject property of `type`'s encrypted fields.
 *
 * @returns the property given as `HasEncryptedFields({ subject })`; undefined for a model sealed under the scope's key
 *          or without the trait.
 * @example
 * encryptedSubjectOf(Contact); // "userId"
 */
export function encryptedSubjectOf(type: object): string | undefined {
  const trait = traitsOf(type).find((record) => record.name === "has_encrypted_fields");
  return trait?.options["subject"] as string | undefined;
}
