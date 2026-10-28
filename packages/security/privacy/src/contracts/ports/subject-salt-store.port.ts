/**
 * Stackra file contract:
 * Purpose: `SubjectSaltStore`, the port that holds each subject's random salt, the input `SubjectKeyProviderDriver`
 *          derives the subject key from: the first seal of a subject's field creates the salt, later seals and opens
 *          read it, and erasure destroys it, which crypto-shreds every field sealed under the key, backups included.
 * Boundary: an abstract class that is its own token, key `privacy.SubjectSaltStore`. Drivers: `postgres` (the
 *           `privacy.subject_salts` table, partitioned by the running scope) and `memory` (tests). A salt is at least 16
 *           random bytes and never leaves the key derivation: it is not logged, exported or put in an event. A leaf
 *           file.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding); ADR 0415 (decision 3); STA-1375; gap gov2
 *                     (stackra-263).
 */
import { Port } from "@stackra/contracts";

/**
 * Creates, reads and destroys subject salts.
 *
 * @example
 * const cipher = new AesGcmFieldCipherDriver(new SubjectKeyProviderDriver(keys, subject, await salts.obtain(subject)));
 */
export abstract class SubjectSaltStore extends Port {
  /** Type-only port key, so `DriverName<SubjectSaltStore>` narrows to this port's drivers. */
  declare readonly "~key": "privacy.SubjectSaltStore";

  /**
   * The salt of `subject`.
   *
   * @returns undefined when the subject has none: it never sealed anything, or it was erased.
   */
  abstract find(subject: string): Promise<Uint8Array | undefined>;

  /** The salt of `subject`, created (32 random bytes) when it has none; two racing callers get the same salt. */
  abstract obtain(subject: string): Promise<Uint8Array>;

  /**
   * Destroys the salt of `subject`, for good.
   *
   * @returns true when a salt was destroyed; false when the subject had none (nothing was sealed under its key).
   */
  abstract destroy(subject: string): Promise<boolean>;
}
