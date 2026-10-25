/**
 * Stackra file contract:
 * Purpose: `FakeConstructor<T>`: the class `Fake.of(Port)` returns, so `class XFake extends Fake.of(Port)` emits a
 *          declaration that names an exported type (ADR 0305 rule 43).
 * Boundary: a public type of the `.` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2); ADR 0305 (rule 43: a called form's base type is exported).
 */
import type { FakeRecorder } from "#core/types/fake-recorder.type";

/**
 * A concrete class of the port `T`: every member of `T` exists (the port's abstract methods are spies until a subclass
 * implements them) and the instance records calls through {@link FakeRecorder}.
 */
export type FakeConstructor<T extends object> = new () => T & FakeRecorder<T>;
