/**
 * Stackra file contract:
 * Purpose: `SubjectCipherResolver`, the port `EncryptedFieldsSubscriber` asks for the cipher of one data subject when a
 *          model is `HasEncryptedFields({ subject })`: a cipher over that subject's own key, so destroying the subject's
 *          salt (erasure) crypto-shreds every field sealed with it.
 * Boundary: an abstract class that is its own token, key `model.SubjectCipherResolver`. @stackra/privacy implements it
 *           over its `SubjectSaltStore` and the scope's `KeyProvider`; this package only calls it. `sealing` may create
 *           the subject's salt (the first seal does); `opening` never does, and answers undefined once the subject is
 *           erased. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding); ADR 0294 (decision 16); gap gov2
 *                     (stackra-263).
 */
import { Port } from "@stackra/contracts";
import type { FieldCipher } from "@stackra/contracts";

/**
 * Hands out per-subject ciphers.
 *
 * @example
 * export class SaltedSubjectCipherResolverDriver extends Driver(SubjectCipherResolver) {
 *   async sealing(subject: string) { return cipherOver(await this.salts.obtain(subject)); }
 * }
 */
export abstract class SubjectCipherResolver extends Port {
  /** Type-only port key, so `DriverName<SubjectCipherResolver>` narrows to this port's drivers. */
  declare readonly "~key": "model.SubjectCipherResolver";

  /** The cipher that seals `subject`'s fields, creating the subject's salt when it has none yet. */
  abstract sealing(subject: string): Promise<FieldCipher>;

  /**
   * The cipher that opens `subject`'s fields.
   *
   * @returns undefined when the subject has no salt: it was erased (or never sealed anything), so its fields are gone.
   */
  abstract opening(subject: string): Promise<FieldCipher | undefined>;
}
