/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: every hook the template imports from `@stackra/clients/react`
 *          (`useQuery`, `useInfiniteQuery`, `useQueryClient`, `useAction`, `useIntentRouter`) is exported, nothing
 *          else is, and `IntentMatch` resolves.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { IntentMatch } from "#react/index";

describe("@stackra/clients/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "useAction",
      "useInfiniteQuery",
      "useIntentRouter",
      "useQuery",
      "useQueryClient",
    ]);
  });

  it("resolves IntentMatch", () => {
    expectTypeOf<IntentMatch["label"]>().toEqualTypeOf<I18nKey>();
  });
});
