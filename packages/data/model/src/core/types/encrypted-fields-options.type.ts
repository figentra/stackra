/**
 * Stackra file contract:
 * Purpose: `EncryptedFieldsOptions`, the options `HasEncryptedFields({ subject } | { lookup }, ...fields)` takes: the
 *          property that names the data subject each row's encrypted fields are sealed for, or the fields that keep a
 *          blind index for equality lookup.
 * Boundary: a type only; `HasEncryptedFields` checks it when the model is defined and records it in the trait registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding); gap gov2 (stackra-263); gap gov9
 *                     (stackra-313).
 */

/** How a model's encrypted fields are keyed. */
export interface EncryptedFieldsOptions {
  /**
   * The property holding the subject's public id (`userId`, or `id` for the subject's own row). Each row's encrypted
   * fields are sealed under that subject's own key, so erasing the subject (destroying its salt) shreds them.
   */
  readonly subject?: string | undefined;

  /**
   * Encrypted fields that also keep a blind index, an HMAC of the plain text under the scope's key in the property
   * `<field>Bidx` (column `<field>_bidx`) the model declares, so `whereEncrypted` finds a row by equal value. Not with
   * `subject`: an index under the scope's key would outlive the subject's shred.
   */
  readonly lookup?: readonly string[] | undefined;
}
