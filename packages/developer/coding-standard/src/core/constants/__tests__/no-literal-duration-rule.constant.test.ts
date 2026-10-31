/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-literal-duration`: literal timing classes, numeric durations, `*_MS` constants,
 *          `.duration(n)` calls, literal springs and literal easings are reported; token-driven motion, zero and
 *          computed values pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0501.
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_LITERAL_DURATION_RULE } from "#core/constants/no-literal-duration-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: { lang: "tsx", ecmaFeatures: { jsx: true } },
  },
});

tester.run(
  "no-literal-duration",
  NO_LITERAL_DURATION_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'const a = <div className="transition duration-(--duration-fast) ease-(--ease-standard)" />;',
      'const b = cn("duration-[var(--duration-base)] ease-[var(--ease-enter)] duration-0 motion-reduce:duration-0");',
      "const c = withTiming(1, { duration: BASE.durationMs, easing: Easing.bezier(...EASE) });",
      "const d = withSpring(0, motionSpring(STACKRA_THEME, 'snappy'));",
      "const e = { duration: 0, delay: 0 };",
      'const f = { easing: "var(--ease-standard)" };',
      "const g = FadeIn.duration(FAST.durationMs);",
      'const h = "The ease-of-use of this page";',
      'const l = <div className="ease-out ease-in-out" />;',
      "function m(delay = 0) {}",
      "const i = { duration: toast.timeout };",
    ],
    invalid: [
      {
        code: 'const a = <div className="transition duration-200" />;',
        errors: [{ messageId: "durationClass", data: { token: "duration-200" } }],
      },
      {
        code: 'const b = cn("data-[entering]:duration-300");',
        errors: [{ messageId: "durationClass", data: { token: "duration-300" } }],
      },
      {
        code: 'const d = "ease-[cubic-bezier(0.2,0,0,1)]";',
        errors: [{ messageId: "durationClass", data: { token: "ease-[cubic-bezier(0.2,0,0,1)]" } }],
      },
      {
        code: "const e = `opacity 200ms cubic-bezier(0.2, 0, 0, 1)`;",
        errors: [{ messageId: "literalEasing", data: { name: "cubic-bezier()" } }],
      },
      {
        code: "const f = withTiming(1, { duration: 300 });",
        errors: [{ messageId: "numericDuration", data: { name: "duration", value: "300" } }],
      },
      {
        code: "function e({ closeDelay = 200 }) {}",
        errors: [{ messageId: "numericDuration", data: { name: "closeDelay", value: "200" } }],
      },
      {
        code: "const SWEEP_MS = 1200;",
        errors: [{ messageId: "numericDuration", data: { name: "SWEEP_MS", value: "1200" } }],
      },
      {
        code: "const g = FadeIn.duration(200);",
        errors: [{ messageId: "numericDuration", data: { name: "duration", value: "200" } }],
      },
      {
        code: 'const h = { type: "spring", stiffness: 500 };',
        errors: [{ messageId: "literalSpring", data: { name: "stiffness", value: "500" } }],
      },
      {
        code: 'const i = { easing: "ease-in-out" };',
        errors: [{ messageId: "literalEasing", data: { name: "easing" } }],
      },
      {
        code: "const j = { ease: [0.2, 0, 0, 1] };",
        errors: [{ messageId: "literalEasing", data: { name: "ease" } }],
      },
      {
        code: "const k = Easing.bezier(0.65, 0, 0.35, 1);",
        errors: [{ messageId: "literalEasing", data: { name: "Easing.bezier()" } }],
      },
    ],
  },
);
