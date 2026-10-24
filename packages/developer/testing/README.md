# @stackra/testing

The generic Stackra test kit. Every package and service test imports its runner and generic helpers from here, so
there is one vitest instance, one way to freeze time and ids, one fake base and one way to add a matcher (ADR 0269).

```ts
import { beforeEach, describe, expect, freezeClock, freezeIds, it, vi } from "@stackra/testing";
```

## What `.` holds

| Export                                                                                                                         | What it does                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `describe`, `it`, `test`, `expect`, `vi`, `beforeAll`, `beforeEach`, `afterAll`, `afterEach`, `onTestFinished`, `expectTypeOf` | vitest's own objects, re-exported (vitest is a peer dependency, so they are the consumer's instance)                |
| `freezeClock(iso)`                                                                                                             | pins `Date.now()` and `new Date()` to `iso` until the test finishes; timers stay real; returns a restore            |
| `freezeIds()`                                                                                                                  | replaces `crypto.getRandomValues` with a seeded stream until the test finishes, so ids repeat; returns a restore    |
| `Fake`, `Fake.of(Port)`                                                                                                        | the base of every `*.fake.ts`: `record(name, value)`, `calls(name)`; unimplemented port methods are `vi.fn()` spies |
| `createMatcher(name, fn)`                                                                                                      | registers an `expect` matcher on import and returns it; type it by augmenting `Matchers`                            |
| `factory<T>(defaults)`                                                                                                         | plain test data for `*.fixture.ts`: `build(overrides)` at index 0, `buildMany(n, overrides)` at `0..n-1`            |
| types `Matchers`, `FakeConstructor`, `FakeRecorder`, `FactoryDefaults`, `FixtureBuilder`                                       | the shapes behind the helpers above                                                                                 |

`.` is generic: it has no workspace dependency and no domain type. Domain helpers (`createTestingModule`, `run`,
actors, `toRefuseWith`, …) live in the `./testing` entry of the package that owns them (ADR 0269 decision 3). The
`./react`, `./native`, `./e2e` and `./contract` entries arrive with navigation and app.

## A fake, a matcher and a fixture

```ts
// src/testing/loyalty-members.fake.ts
export class LoyaltyMembersFake extends Fake.of(LoyaltyMembers) {
  async isMember(id: MemberId): Promise<boolean> {
    this.record("isMember", id); // read back with calls("isMember")
    return true;
  }
}

// src/testing/to-have-balance.matcher.ts
export const toHaveBalance = createMatcher(
  "toHaveBalance",
  async (ledger: LoyaltyLedger, member: MemberId, points: number) => {
    const actual = await ledger.balance(member);
    return { pass: actual === points, message: () => `expected ${points} points, found ${actual}` };
  },
);
declare module "@stackra/testing" {
  interface Matchers<R> {
    toHaveBalance(member: MemberId, points: number): Promise<R>;
  }
}

// src/testing/points-entry.fixture.ts
export const pointsEntry = factory<PointsEntry>({
  points: 100,
  reference: (i) => `ord_${i}`,
  at: () => new Date(),
});
```

## Notes

- `freezeClock` and `freezeIds` restore themselves when called inside a test or `beforeEach`. Called in `beforeAll`,
  the state holds for the rest of the file; run the returned function in `afterAll` to end it earlier.
- `freezeIds` does not cover `crypto.randomUUID`.
- A spy of `Fake.of` is made on the first read of a lowerCamel name the fake lacks; `then`, `toJSON` and the other
  names promises, JSON and printers probe for are never spied, so a fake can be awaited and printed.
- `vi.mock` must hoist when `vi` comes from this package (ADR 0269 decision 4); `src/__tests__/mock-hoisting.test.ts`
  is the gate.
