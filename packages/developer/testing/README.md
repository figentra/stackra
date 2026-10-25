# @stackra/testing

The generic Stackra test kit. Every package and service test imports its runner and generic helpers from here, so
there is one vitest instance, one way to freeze time and ids, one fake base and one way to add a matcher (ADR 0269).

```ts
import { beforeEach, describe, expect, freezeClock, freezeIds, it } from "@stackra/testing";
import { vi } from "vitest";
```

## What `.` holds

| Export                                                                                                                   | What it does                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `describe`, `it`, `test`, `expect`, `beforeAll`, `beforeEach`, `afterAll`, `afterEach`, `onTestFinished`, `expectTypeOf` | vitest's own objects, re-exported (vitest is a peer dependency, so they are the consumer's instance)                            |
| `vi`                                                                                                                     | not re-exported: import it from `vitest`, the only import vitest hoists `vi.mock` for (ADR 0269 decision 4, note of 2026-10-24) |
| `freezeClock(iso)`                                                                                                       | pins `Date.now()` and `new Date()` to `iso` until the test finishes; timers stay real; returns a restore                        |
| `freezeIds()`                                                                                                            | replaces `crypto.getRandomValues` with a seeded stream until the test finishes, so ids repeat; returns a restore                |
| `Fake`, `Fake.of(Port)`                                                                                                  | the base of every `*.fake.ts`: `record(name, value)`, `calls(name)`; unimplemented port methods are `vi.fn()` spies             |
| `createMatcher(name, fn)`                                                                                                | registers an `expect` matcher on import and returns it; type it by augmenting `Matchers`                                        |
| `factory<T>(defaults)`                                                                                                   | plain test data for `*.fixture.ts`: `build(overrides)` at index 0, `buildMany(n, overrides)` at `0..n-1`                        |
| types `Matchers`, `FakeConstructor`, `FakeRecorder`, `FactoryDefaults`, `FixtureBuilder`                                 | the shapes behind the helpers above                                                                                             |

`.` is generic: it has no workspace dependency and no domain type. Domain helpers (`createTestingModule`, `run`,
actors, `toRefuseWith`, …) live in the `./testing` entry of the package that owns them (ADR 0269 decision 3). The
`./e2e` and `./contract` entries arrive with app.

## `./react` and `./native`

Thin, provider-agnostic wrappers over Testing Library. They depend on no workspace package either, so every package's
tests can use them; a framework package passes its own providers.

| Entry      | Export                                           | What it does                                                                                                          |
| ---------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `./react`  | `render(ui, { providers, wrapper, ...options })` | `@testing-library/react`'s render; `providers` (first outermost) and `wrapper` (innermost) become one wrapper         |
| `./react`  | `renderHook(hook, { providers, wrapper, ... })`  | the same for a hook                                                                                                   |
| `./react`  | `userEvent`                                      | user-event with the house default: one `userEvent.setup()` session per render, used by every call until the test ends |
| `./react`  | `screen`, `within`, `act`                        | Testing Library's own                                                                                                 |
| `./native` | `render`, `renderHook`, `userEvent`              | the same over `@testing-library/react-native` 14, whose renders are asynchronous: `await render(...)`                 |
| `./native` | `screen`, `act`                                  | the library's own                                                                                                     |
| `./native` | `axe(view)`, `toHaveNoViolations`                | `expect(await axe(view)).toHaveNoViolations()`: pressables have a name, images a label, headings a name               |

```ts
import { describe, expect, it } from "@stackra/testing";
import { render, screen, userEvent } from "@stackra/testing/react";

it("cancels", async () => {
  render(<OrderCard order={order} />, { providers: [I18nTestProvider] });
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
});
```

- Every render is cleaned up when its test finishes (vitest runs without globals here, so the libraries' own
  auto-cleanup never registers).
- A web test switches itself to jsdom with `// @vitest-environment jsdom`. `./native` imports the library's `pure`
  entry, so no jest matchers or global hooks are installed.
- `axe` on native checks three rules over the host tree, not axe-core's set (there is no React Native runner).
- The route helpers (`renderRoute`, `renderLayout`, `runRouteLoader`, `runRouteSubmit`, `routeMeta`) need navigation,
  so they live in `@stackra/navigation/testing`.

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
- `vi.mock` must hoist when `vi` comes from `vitest`, and this package re-exports no `vi` (ADR 0269 decision 4, note of
  2026-10-24); `src/__tests__/mock-hoisting.test.ts` is the gate.
