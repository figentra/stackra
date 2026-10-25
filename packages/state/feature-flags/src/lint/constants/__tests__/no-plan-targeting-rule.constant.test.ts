/**
 * Stackra file contract:
 * Purpose: rule tests of `feature-flags/no-plan-targeting`: a flag named after a plan, tier, edition, entitlement or
 *          subscription, or a `Flag({...})` option keyed by one, is reported; release switches and other classes pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0213 (decision 7).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_PLAN_TARGETING_RULE } from "#lint/constants/no-plan-targeting-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run(
  "no-plan-targeting",
  NO_PLAN_TARGETING_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      "export class HelpCentreFlag extends Flag({ default: false }) {}",
      'export class PlannerViewFlag extends Flag({ default: false, expires: "2027-03-31" }) {}',
      "export class ProPlanCard extends Card({}) {}",
      "const options = { plan: 'pro' };",
    ],
    invalid: [
      {
        code: "export class ProPlanFlag extends Flag({ default: false }) {}",
        errors: [{ messageId: "planName", data: { name: "ProPlanFlag", word: "Plan" } }],
      },
      {
        code: "export class EnterpriseTierReportsFlag extends Flag({ default: false }) {}",
        errors: [
          { messageId: "planName", data: { name: "EnterpriseTierReportsFlag", word: "Tier" } },
        ],
      },
      {
        code: 'export class ReportsFlag extends Flag({ default: false, plans: ["pro"] }) {}',
        errors: [{ messageId: "planOption", data: { word: "plans" } }],
      },
      {
        code: 'const ReportsFlag = class extends Flag({ default: false, "entitlement": "reports" }) {};',
        errors: [{ messageId: "planOption", data: { word: "entitlement" } }],
      },
    ],
  },
);
