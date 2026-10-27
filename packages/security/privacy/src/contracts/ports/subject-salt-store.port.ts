/**
 * Stackra file contract:
 * Purpose: `SubjectSaltStore`, the port that holds each subject's random salt, the input `SubjectKeyProviderDriver`
 *          derives the subject key from; erasure destroys the salt, which crypto-shreds every field sealed under the
 *          key, backups included.
 * Boundary: an abstract class that is its own token, key `privacy.SubjectSaltStore`. The host's key service
 *           implements it (`Driver(SubjectSaltStore)`); the memory driver is for tests. This package never reads a
 *           salt; it only destroys one. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding); ADR 0415 (decision 3); STA-1375.
 */
import { Port } from "@stackra/contracts";

/**
 * Destroys subject salts.
 *
 * @example
 * export class KmsSubjectSaltStoreDriver extends Driver(SubjectSaltStore) {
 *   async destroy(subject: string) { return (await this.salts.delete({ subject })) > 0; }
 * }
 */
export abstract class SubjectSaltStore extends Port {
  /** Type-only port key, so `DriverName<SubjectSaltStore>` narrows to this port's drivers. */
  declare readonly "~key": "privacy.SubjectSaltStore";

  /**
   * Destroys the salt of `subject`, for good.
   *
   * @returns true when a salt was destroyed; false when the subject had none (nothing was sealed under its key).
   */
  abstract destroy(subject: string): Promise<boolean>;
}
