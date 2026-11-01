/**
 * Stackra file contract:
 * Purpose: unit tests of `isHooksTarget`, the file filter of the `hooks` phase.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0305 (rule 41); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { isHooksTarget } from "#node/functions/is-hooks-target.function";

describe("isHooksTarget", () => {
  it("accepts .tsx files in the component homes and mail templates", () => {
    for (const path of [
      "packages/x/y/src/react/counter/counter.tsx",
      "packages/x/y/src/native/counter/counter.tsx",
      "apps/console/src/components/header/header.tsx",
      "apps/console/src/blocks/hero/hero.tsx",
      "apps/console/src/routes/home/home.tsx",
      "services/a/src/modules/m/mails/welcome.mail.tsx",
    ])
      expect(isHooksTarget(path), path).toBe(true);
  });

  it("refuses tests, fixtures, generated output, hook files and other files", () => {
    for (const path of [
      "packages/x/y/src/react/counter/__tests__/counter.test.tsx",
      "packages/x/y/src/react/__tests__/fixtures/a.tsx",
      "packages/x/y/src/react/counter/use-counter.tsx",
      "apps/console/.stackra/gen/routes/a.tsx",
      "packages/x/y/src/core/a.tsx",
      "packages/x/y/src/react/counter/counter.ts",
      "packages/x/y/node_modules/z/src/react/a.tsx",
    ])
      expect(isHooksTarget(path), path).toBe(false);
  });
});
