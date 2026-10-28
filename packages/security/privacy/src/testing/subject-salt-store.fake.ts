/**
 * Stackra file contract:
 * Purpose: `SubjectSaltStoreFake`, the test double of `SubjectSaltStore`: records every `destroy` call with all its
 *          arguments and answers whether the subject held a salt.
 * Boundary: test only; exported from `./testing`. Built with the subjects that hold a salt; never a real key.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); BUILDER-RULES rule 6e (fakes record every argument); STA-1375.
 */
import { Fake } from "@stackra/testing";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";

/**
 * A recording salt store.
 *
 * @example
 * const salts = SubjectSaltStoreFake.holding(["usr_1"]);
 * expect(salts.calls("destroy")).toEqual(["usr_1"]);
 */
export class SubjectSaltStoreFake extends Fake.of(SubjectSaltStore) {
  /** The subjects that still hold a salt. */
  private readonly subjects: Set<string>;

  /**
   * @param subjects - the subjects that start with a salt.
   */
  constructor(subjects: readonly string[] = []) {
    super();
    this.subjects = new Set(subjects);
  }

  /** A fake where `subjects` hold a salt. */
  static holding(subjects: readonly string[]): SubjectSaltStoreFake {
    return new SubjectSaltStoreFake(subjects);
  }

  /** Records the call; true when the subject held a salt. */
  destroy(subject: string): Promise<boolean> {
    this.record("destroy", subject);
    return Promise.resolve(this.subjects.delete(subject));
  }
}
