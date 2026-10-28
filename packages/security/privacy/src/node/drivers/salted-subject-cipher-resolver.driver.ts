/**
 * Stackra file contract:
 * Purpose: `SaltedSubjectCipherResolverDriver`, the `salted` driver of @stackra/model's `SubjectCipherResolver`: the
 *          cipher of one data subject is AES-GCM over `SubjectKeyProviderDriver`, the scope's key derived with the
 *          subject's salt from `SubjectSaltStore`, so `EncryptedFieldsSubscriber` seals a `HasEncryptedFields({ subject
 *          })` row under its subject's own key and `EraseSubjectWorkflow.shred` (destroying the salt) makes it
 *          unreadable.
 * Boundary: implements the port only. `sealing` obtains the salt (the first seal creates it); `opening` only finds it
 *           and answers undefined when it is gone. The scope's `KeyProvider` is the one the host binds (memory,
 *           `aws-kms`), which picks the running scope's key. shortcut: the salt is read on each call (one query per
 *           row sealed or loaded), with no cache, because a cache would outlive an erasure and the scope; add a
 *           per-unit-of-work cache when a list of subject-sealed rows shows up in a profile.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding); ADR 0415 (decision 3); gap gov2
 *                     (stackra-263).
 */
import { Driver } from "@stackra/container";
import {
  AesGcmFieldCipherDriver,
  type FieldCipher,
  type KeyProvider,
  SubjectKeyProviderDriver,
} from "@stackra/contracts";
import { SubjectCipherResolver } from "@stackra/model";

import type { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";

/**
 * Hands out a cipher per subject over the scope's key and the subject's salt.
 *
 * @example
 * new EncryptedFieldsSubscriber(cipher, new SaltedSubjectCipherResolverDriver(keys, salts));
 */
export class SaltedSubjectCipherResolverDriver extends Driver(SubjectCipherResolver) {
  /** The scope's keys. */
  private readonly keys: KeyProvider;

  /** The subjects' salts. */
  private readonly salts: SubjectSaltStore;

  /**
   * @param keys - the scope's key provider the host binds.
   * @param salts - the subject salt store.
   */
  constructor(keys: KeyProvider, salts: SubjectSaltStore) {
    super();
    this.keys = keys;
    this.salts = salts;
  }

  /** The cipher sealing `subject`'s fields; creates the subject's salt on its first seal. */
  async sealing(subject: string): Promise<FieldCipher> {
    return this.cipherOf(subject, await this.salts.obtain(subject));
  }

  /** The cipher opening `subject`'s fields; undefined once the subject is erased. */
  async opening(subject: string): Promise<FieldCipher | undefined> {
    const salt = await this.salts.find(subject);
    return salt === undefined ? undefined : this.cipherOf(subject, salt);
  }

  /** AES-GCM over the subject's derived key. */
  private cipherOf(subject: string, salt: Uint8Array): FieldCipher {
    return new AesGcmFieldCipherDriver(new SubjectKeyProviderDriver(this.keys, subject, salt));
  }
}
