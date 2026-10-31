/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-backdrop-filter`: backdrop utilities, the CSS property in a string, a
 *          `backdropFilter` style key and expo-blur or expo-glass-effect imports are reported; material classes and
 *          roles, a plain image blur and other imports pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0320.
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_BACKDROP_FILTER_RULE } from "#core/constants/no-backdrop-filter-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: { lang: "tsx", ecmaFeatures: { jsx: true } },
  },
});

tester.run(
  "no-backdrop-filter",
  NO_BACKDROP_FILTER_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'const a = <div className="material-role-toast material-glass p-2" />;',
      'const b = cn("scale-110 blur-md", "backdrop");',
      'import { View } from "react-native";',
      'const c = "the backdrop of a modal";',
    ],
    invalid: [
      {
        code: 'const a = <div className="bg-background/95 backdrop-blur" />;',
        errors: [{ messageId: "backdrop", data: { token: "backdrop-blur" } }],
      },
      {
        code: 'const b = cn("md:backdrop-blur-[2px]");',
        errors: [{ messageId: "backdrop", data: { token: "backdrop-blur-[2px]" } }],
      },
      {
        code: "const c = `.x { backdrop-filter: blur(8px) }`;",
        errors: [{ messageId: "backdrop", data: { token: "backdrop-filter" } }],
      },
      {
        code: 'const d = { backdropFilter: "blur(4px)" };',
        errors: [{ messageId: "backdrop", data: { token: "backdropFilter" } }],
      },
      {
        code: 'import { BlurView } from "expo-blur";',
        errors: [{ messageId: "module", data: { module: "expo-blur" } }],
      },
      {
        code: 'import { GlassView } from "expo-glass-effect";',
        errors: [{ messageId: "module", data: { module: "expo-glass-effect" } }],
      },
    ],
  },
);
