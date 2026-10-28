/**
 * Stackra file contract:
 * Purpose: `MemorySubjectSaltStoreDriver`, the `memory` driver of `SubjectSaltStore`: subject salts in a map, for tests
 *          and previews.
 * Boundary: not durable and not scoped; the `postgres` driver replaces it in production. Salts are 32 bytes from Web
 *           Crypto; each read hands out a copy, so a caller cannot change a stored salt. Seeded with `put`, not a
 *           constructor parameter, so gen and the container build it with no token (`token_not_a_class`, STA-1299).
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2); ADR 0212 (crypto-shredding); STA-1375; gap gov2 (stackra-263).
 */
import { Driver } from "@stackra/container";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";

/** The length of a new salt, in bytes. */
const SALT_BYTES = 32;

/**
 * Keeps subject salts in memory.
 *
 * @example
 * const salts = new MemorySubjectSaltStoreDriver();
 * salts.put(["usr_1"]);
 * await salts.destroy("usr_1"); // true
 */
export class MemorySubjectSaltStoreDriver extends Driver(SubjectSaltStore) {
  /** Each subject's salt. */
  private readonly salts = new Map<string, Uint8Array>();

  /** Gives each of `subjects` a salt; the container builds the driver, so seeding is a call, not a parameter. */
  put(subjects: readonly string[]): void {
    for (const subject of subjects) this.salts.set(subject, newSalt());
  }

  /** Whether `subject` still holds a salt. */
  has(subject: string): boolean {
    return this.salts.has(subject);
  }

  /** A copy of `subject`'s salt; undefined when it has none. */
  async find(subject: string): Promise<Uint8Array | undefined> {
    const salt = this.salts.get(subject);
    return salt === undefined ? undefined : new Uint8Array(salt);
  }

  /** A copy of `subject`'s salt, created when it has none. */
  async obtain(subject: string): Promise<Uint8Array> {
    let salt = this.salts.get(subject);
    if (salt === undefined) {
      salt = newSalt();
      this.salts.set(subject, salt);
    }
    return new Uint8Array(salt);
  }

  /** Forgets `subject`'s salt. */
  async destroy(subject: string): Promise<boolean> {
    return this.salts.delete(subject);
  }
}

/** A new random salt. */
function newSalt(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}
