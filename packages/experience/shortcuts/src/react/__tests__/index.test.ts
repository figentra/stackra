/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the template imports `ShortcutKeys`, `useRunShortcut`,
 *          `useShortcut`, `useShortcuts` and the `ShortcutItem` type, the generated entry mounts `ShortcutBindings`,
 *          and nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as react from "#react/index";
import type { ShortcutItem } from "#react/index";

describe("@stackra/shortcuts/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "ShortcutBindings",
      "ShortcutKeys",
      "useRunShortcut",
      "useShortcut",
      "useShortcuts",
    ]);
  });

  it("exports the ShortcutItem type the palette groups", () => {
    expectTypeOf<ShortcutItem["group"]>().toEqualTypeOf<string>();
    expectTypeOf<ShortcutItem["keys"]>().toEqualTypeOf<string | undefined>();
  });
});
