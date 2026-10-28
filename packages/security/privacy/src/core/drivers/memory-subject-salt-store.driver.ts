/**
 * Stackra file contract:
 * Purpose: `MemorySubjectSaltStoreDriver`, the `memory` driver of `SubjectSaltStore`: the subjects that have a salt,
 *          for tests and previews.
 * Boundary: knows only which subjects hold a salt, never the salt itself; `destroy` forgets the subject. Not durable;
 *           a host's key service replaces it in production. Seeded with `put`, not a constructor parameter, so gen
 *           and the container build it with no token (`token_not_a_class`, STA-1299).
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2); ADR 0212 (crypto-shredding); STA-1375.
 */
import { Driver } from "@stackra/container";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";

/**
 * Tracks which subjects hold a salt.
 *
 * @example
 * const salts = new MemorySubjectSaltStoreDriver();
 * salts.put(["usr_1"]);
 * await salts.destroy("usr_1"); // true
 */
export class MemorySubjectSaltStoreDriver extends Driver(SubjectSaltStore) {
  /** The subjects that still hold a salt. */
  private readonly subjects = new Set<string>();

  /** Gives each of `subjects` a salt; the container builds the driver, so seeding is a call, not a parameter. */
  put(subjects: readonly string[]): void {
    for (const subject of subjects) this.subjects.add(subject);
  }

  /** Whether `subject` still holds a salt. */
  has(subject: string): boolean {
    return this.subjects.has(subject);
  }

  /** Forgets `subject`'s salt. */
  async destroy(subject: string): Promise<boolean> {
    return this.subjects.delete(subject);
  }
}
