/**
 * Stackra file contract:
 * Purpose: `MemorySubjectSaltStoreDriver`, the `memory` driver of `SubjectSaltStore`: the subjects that have a salt,
 *          for tests and previews.
 * Boundary: knows only which subjects hold a salt, never the salt itself; `destroy` forgets the subject. Not durable;
 *           a host's key service replaces it in production.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2); ADR 0212 (crypto-shredding); STA-1375.
 */
import { Driver } from "@stackra/container";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";

/**
 * Tracks which subjects hold a salt.
 *
 * @example
 * const salts = new MemorySubjectSaltStoreDriver(["usr_1"]);
 * await salts.destroy("usr_1"); // true
 */
export class MemorySubjectSaltStoreDriver extends Driver(SubjectSaltStore) {
  /** The subjects that still hold a salt. */
  private readonly subjects: Set<string>;

  /**
   * @param subjects - the subjects that start with a salt.
   */
  constructor(subjects: readonly string[] = []) {
    super();
    this.subjects = new Set(subjects);
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
