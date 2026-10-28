/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `signal`, `useSignal` and `useStore`, the symbols the template
 *          imports from `@stackra/state/react`, are exported and nothing else is; the `StateSignal` type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { StateSignal } from "#react/index";

describe("@stackra/state/react", () => {
  it("exports exactly signal, useSignal and useStore", () => {
    expect(Object.keys(react).sort()).toEqual(["signal", "useSignal", "useStore"]);
    for (const value of Object.values(react)) expect(value).toBeTypeOf("function");
  });

  it("resolves the StateSignal type", () => {
    expectTypeOf(react.signal(1)).toEqualTypeOf<StateSignal<number>>();
  });
});
