/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-raw-key-literal`: string literals in icon, column-key, route-key and permission
 *          positions are reported; generated files and a module's own `*.constant.*` definitions are exempt.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_RAW_KEY_LITERAL_RULE } from "#core/constants/no-raw-key-literal-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run(
  "no-raw-key-literal",
  NO_RAW_KEY_LITERAL_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      {
        filename: "src/a.ts",
        code: "const a = { icon: Icons.House, permission: Permissions.Read };",
      },
      { filename: "src/a.ts", code: 'const a = { title: "Home", name: "icon" };' },
      { filename: "src/a.generated.ts", code: 'const a = { icon: "house" };' },
      { filename: "src/generated/a.ts", code: 'const a = { routeKey: "home" };' },
      {
        filename: "src/core/constants/identity-claims.constant.ts",
        code: 'export const IDENTITY_CLAIMS = Object.freeze({ permissions: "urn:stackra:permissions" });',
      },
      {
        filename: "src/core/constants/feedback-by-tone.constant.ts",
        code: 'export const FEEDBACK_BY_TONE = { success: { icon: "circle-check", role: "status" } };',
      },
    ],
    invalid: [
      {
        filename: "src/a.ts",
        code: 'const a = { icon: "house" };',
        errors: [{ messageId: "rawKey", data: { position: "icon", literal: '"house"' } }],
      },
      {
        filename: "src/a.ts",
        code: 'const a = { "columnKey": "name", routeKey: "home" };',
        errors: [
          { messageId: "rawKey", data: { position: "columnKey", literal: '"name"' } },
          { messageId: "rawKey", data: { position: "routeKey", literal: '"home"' } },
        ],
      },
      {
        filename: "src/core/constants/__tests__/a.constant.test.ts",
        code: 'const a = { icon: "house" };',
        errors: [{ messageId: "rawKey", data: { position: "icon", literal: '"house"' } }],
      },
      {
        filename: "src/a.ts",
        code: 'const a = { permissions: ["orders.read", Permissions.Write] };',
        errors: [
          { messageId: "rawKey", data: { position: "permissions", literal: '"orders.read"' } },
        ],
      },
    ],
  },
);
