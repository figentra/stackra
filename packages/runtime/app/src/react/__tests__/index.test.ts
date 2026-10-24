/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `Contexts` (the template's web `root.tsx` imports it) and
 *          `registerContext` are exported, nothing else is (the registry and the i18n context stay internal), and the
 *          props types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0295 (decision 10).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { ContextComponent, ContextProps, ContextsProps } from "#react/index";

describe("@stackra/app/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["Contexts", "registerContext"]);
  });

  it("exports the props types", () => {
    expectTypeOf<ContextsProps>().toExtend<ContextProps>();
    expectTypeOf<ContextsProps["contexts"]>().toEqualTypeOf<readonly string[] | undefined>();
    expectTypeOf(react.registerContext).parameter(1).toEqualTypeOf<ContextComponent>();
  });
});
