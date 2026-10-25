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
actors, `toRefuseWith`, …) live in the `./testing` entry of the package that owns them (ADR 0269 decision 3). There is no `./node` or
`./contract` entry: nothing imports one yet.

## `./react` and `./native`

Thin, provider-agnostic wrappers over Testing Library. The render helpers depend on no workspace package, so every
package's tests can use them; a framework package passes its own providers. `./react` also offers navigation's route
helpers, so an app's route tests import one entry.

| Entry      | Export                                           | What it does                                                                                                          |
| ---------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `./react`  | `render(ui, { providers, wrapper, ...options })` | `@testing-library/react`'s render; `providers` (first outermost) and `wrapper` (innermost) become one wrapper         |
| `./react`  | `renderHook(hook, { providers, wrapper, ... })`  | the same for a hook                                                                                                   |
| `./react`  | `userEvent`                                      | user-event with the house default: one `userEvent.setup()` session per render, used by every call until the test ends |
| `./react`  | `screen`, `within`, `act`                        | Testing Library's own                                                                                                 |
| `./react`  | `renderRoute`, `renderLayout`                    | `@stackra/navigation/testing`'s: mount a route (by class or `Routes.<key>`) or a layout under a router stub           |
| `./react`  | `runRouteLoader`, `runRouteSubmit`, `routeMeta`  | the same package's: run a loader, a submit or `meta` with a fake route context                                        |
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
- The route helpers are `@stackra/navigation/testing`'s own objects. `@stackra/navigation` is an optional peer and
  a dev dependency here, so `./react` resolves; navigation's tests import vitest directly, so there is no turbo cycle.
  An app that uses them already depends on navigation.
- `./native` has no `renderRoute` (STA-348 #45 stays open): mounting a React Navigation screen needs a native route
  table and native testing parts, which `@stackra/navigation/testing` does not export (it is web only). Tracked
  dependency: add the native `renderRoute(Routes.<key>, { locale, clients, session, storage, consent, flags, platform,
analytics })` to `@stackra/navigation/testing` first, returning `{ navigation, i18n, tenancy, ... }`; then
  `./native` offers it, as `./react` does, and the mobile template tests resolve `@stackra/testing/native`.

## `./e2e`

The end-to-end tier over Playwright (ADR 0269 decision 6). It runs in the Playwright runner only, never under vitest;
`@playwright/test` and `@axe-core/playwright` are optional peers.

| Export                     | What it does                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `test`                     | Playwright's `test`; every test records the requests its context sent and got an answer to                           |
| `expect`                   | Playwright's `expect` plus `toHaveNoViolations()` for `axe`'s report                                                 |
| `axe(page)`                | axe-core with the WCAG 2.x A and AA tags; `toHaveNoViolations` fails on serious or critical only (ADR 0183 d2)       |
| `apiCalls(key)`            | the recorded calls of a consumed key (`orders.order.create@1`), found through the app's and services' manifests      |
| `seed(key)`                | runs one seeder in the stack (`POST /__stackra/e2e/seed`)                                                            |
| `loginAs(page, actor)`     | signs a test actor in on the page's context (`POST /__stackra/e2e/session`)                                          |
| `evictShell(page)`         | deletes the precached `index.html` shells, so the worker answers with the offline page                               |
| `launchDesktop({ fakes })` | launches `dist/desktop/main.js` under Playwright's Electron with `STACKRA_E2E_FAKES`; `app.openUrl(link)` deep-links |
| `e2ePreset(options)`       | the Playwright config gen writes: projects per runner and RTL locale, `pwa` and `desktop` projects, the stack        |
| `E2E_CONTROL`              | the control route paths the stack serves                                                                             |

```ts
import { axe, expect, loginAs, seed, test } from "@stackra/testing/e2e";

test.beforeEach(async ({ page }) => {
  await seed("orders.demo");
  await loginAs(page, { role: "staff", tenant: "ten_1" });
});

test("places a quick order", async ({ page }) => {
  await page.goto("/quick-order");
  await expect(await axe(page)).toHaveNoViolations();
});
```

What the e2e stack must provide (`stackra dev` started by `e2ePreset` with `STACKRA_E2E=1`):

- `POST /__stackra/e2e/seed` with `{ key }` and `POST /__stackra/e2e/session` with `{ role, tenant, memberships? }` on
  the app's origin, answering 2xx (the session route sets the session cookie);
- the consumed services from `STACKRA_E2E_SERVICES` on memory drivers, seeded with `STACKRA_E2E_SEEDS`, and
  Cloudflare's Turnstile test keys when `STACKRA_E2E_TURNSTILE=test-keys`;
- in the desktop main process, a bridge named in `STACKRA_E2E_FAKES` answers with its value as `data`.

None of these is served yet; the journeys that use `seed`, `loginAs` or `launchDesktop` fail until they are.

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
