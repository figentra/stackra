/**
 * Stackra file contract:
 * Purpose: `createMatcher(name, fn)`: registers a custom `expect` matcher on import and returns it named, so a domain
 *          package's matcher file is one call plus its `Matchers` augmentation.
 * Boundary: generic registration only; the domain matchers themselves live in each owning package's `./testing`
 *           entry (ADR 0269 decision 3). The matcher's type comes from augmenting `Matchers` of `@stackra/testing`.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 2 and 3).
 */
import { expect, type MatcherResult } from "vitest";

/**
 * Registers `matcher` with `expect.extend` under `name` and returns it, named `name`. `pass` decides the outcome
 * and `.not` inverts it; `message` is shown on failure either way, so word it for both. An async matcher is awaited:
 * `await expect(x).toY()`.
 *
 * @param name - the matcher name, such as `toHaveBalance`; the same name in a `Matchers` augmentation types it.
 * @param matcher - receives the value under test, then the matcher's arguments.
 * @returns the registered matcher, for `describe(matcher, ...)` and the `./testing` barrel.
 * @example
 * export const toBeEven = createMatcher("toBeEven", (n: number) => ({
 *   pass: n % 2 === 0,
 *   message: () => `expected ${n} to be even`,
 * }));
 */
export function createMatcher<R, A extends unknown[]>(
  name: string,
  matcher: (received: R, ...expected: A) => MatcherResult,
): (received: R, ...expected: A) => MatcherResult {
  const named = (received: R, ...expected: A): MatcherResult => matcher(received, ...expected);
  Object.defineProperty(named, "name", { value: name });
  expect.extend({ [name]: named });
  return named;
}
