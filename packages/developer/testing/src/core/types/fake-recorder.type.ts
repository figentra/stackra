/**
 * Stackra file contract:
 * Purpose: `FakeRecorder<T>`: the call recording a port fake adds on top of its port `T`: `record` in a method body,
 *          `calls` in an assertion, both typed by the port's method names and first arguments.
 * Boundary: a public type of the `.` entry, the instance side of `Fake.of(Port)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2: generic fakes); ADR 0266 (decision 2: a fake per capability).
 */

/** Typed call recording for a fake of `T`. */
export interface FakeRecorder<T> {
  /**
   * Records one call of `name` with its first argument, in order.
   *
   * @param name - a method of the port.
   * @param value - the first argument the method received.
   */
  record: <K extends keyof T & string>(
    name: K,
    value: T[K] extends (...args: infer A) => unknown ? A[0] : never,
  ) => void;

  /**
   * The values recorded for `name`, oldest first; empty when it was never recorded.
   *
   * @param name - a method of the port.
   */
  calls: <K extends keyof T & string>(
    name: K,
  ) => readonly (T[K] extends (...args: infer A) => unknown ? A[0] : never)[];
}
