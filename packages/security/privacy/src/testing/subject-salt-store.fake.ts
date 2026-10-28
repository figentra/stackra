/**
 * Stackra file contract:
 * Purpose: `SubjectSaltStoreFake`, the test double of `SubjectSaltStore`: records every `find`, `obtain` and `destroy`
 *          call with all its arguments and keeps a fixed, recognisable salt per subject.
 * Boundary: test only; exported from `./testing`. A subject's salt is 16 bytes of its index, never a real salt.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); BUILDER-RULES rule 6e (fakes record every argument); STA-1375; stackra-263.
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
  /** Each subject's salt. */
  private readonly salts = new Map<string, Uint8Array>();

  /** How many salts were made, so each new one differs. */
  private made = 0;

  /**
   * @param subjects - the subjects that start with a salt.
   */
  constructor(subjects: readonly string[] = []) {
    super();
    for (const subject of subjects) this.salts.set(subject, this.next());
  }

  /** A fake where `subjects` hold a salt. */
  static holding(subjects: readonly string[]): SubjectSaltStoreFake {
    return new SubjectSaltStoreFake(subjects);
  }

  /** Records the call; the subject's salt, if it holds one. */
  find(subject: string): Promise<Uint8Array | undefined> {
    this.record("find", subject);
    return Promise.resolve(this.salts.get(subject));
  }

  /** Records the call; the subject's salt, made when it holds none. */
  obtain(subject: string): Promise<Uint8Array> {
    this.record("obtain", subject);
    let salt = this.salts.get(subject);
    if (salt === undefined) {
      salt = this.next();
      this.salts.set(subject, salt);
    }
    return Promise.resolve(salt);
  }

  /** Records the call; true when the subject held a salt. */
  destroy(subject: string): Promise<boolean> {
    this.record("destroy", subject);
    return Promise.resolve(this.salts.delete(subject));
  }

  /** A new 16-byte salt filled with the count of salts made so far. */
  private next(): Uint8Array {
    this.made += 1;
    return new Uint8Array(16).fill(this.made);
  }
}
