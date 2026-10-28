/**
 * Stackra file contract:
 * Purpose: `toHaveNoViolations`, the matcher of `axe`'s result: passes when the check found nothing, and lists each
 *          violation's rule and message when it found some.
 * Boundary: registered with `expect` when the `./native` entry is imported (`createMatcher`), and typed by augmenting
 *           `Matchers` of `@stackra/testing`.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decisions 3 and 6).
 */
import { createMatcher } from "#core/functions/create-matcher.function";
import type { AxeResult } from "#native/axe/axe-result.type";

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** `axe` found no accessibility violation. */
    toHaveNoViolations: () => R;
  }
}

/**
 * Passes when an axe result has no violations.
 *
 * @example
 * expect(await axe(view)).toHaveNoViolations();
 */
export const toHaveNoViolations = createMatcher("toHaveNoViolations", (result: AxeResult) => ({
  pass: result.violations.length === 0,
  message: () =>
    result.violations.length === 0
      ? "expected accessibility violations, found none"
      : [
          `expected no accessibility violations, found ${result.violations.length}:`,
          ...result.violations.map((violation) => `- ${violation.rule}: ${violation.message}`),
        ].join("\n"),
}));
