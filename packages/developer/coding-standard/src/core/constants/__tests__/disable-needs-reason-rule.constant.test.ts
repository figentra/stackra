/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/disable-needs-reason`: a disable with rules and a reason passes in line and block
 *          form; a missing rule or reason is reported; `oxlint-enable` and prose mentions are ignored.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing. The invalid
 *           cases use `-next-line`, so the directive under test never suppresses its own finding.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { DISABLE_NEEDS_REASON_RULE } from "#core/constants/disable-needs-reason-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { sourceType: "module" } });

tester.run(
  "disable-needs-reason",
  DISABLE_NEEDS_REASON_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      "// oxlint-disable-next-line no-console -- the CLI prints its report\nconsole.log(1);",
      "/* eslint-disable no-console -- a CLI entry point */\nconsole.log(1);",
      "// oxlint-disable-next-line no-console, no-debugger -- a debugging script\nconsole.log(1);",
      "// oxlint-enable no-console\nconsole.log(1);",
      "// see the oxlint-disable rule in ADR 0129\nconsole.log(1);",
    ],
    invalid: [
      {
        code: "// oxlint-disable-next-line no-console\nconsole.log(1);",
        errors: [{ messageId: "missingReason" }],
      },
      {
        code: "// oxlint-disable-next-line no-console --\nconsole.log(1);",
        errors: [{ messageId: "missingReason" }],
      },
      {
        code: "// oxlint-disable-next-line -- the whole line is noisy\nconsole.log(1);",
        errors: [{ messageId: "missingRule" }],
      },
      {
        code: "// eslint-disable-next-line\nconsole.log(1);",
        errors: [{ messageId: "missingRule" }],
      },
    ],
  },
);
