/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the template imports `Shortcut` and the `ShortcutContext` type, the
 *          registry adds the conflict detector and the wiring's `registerShortcuts`, and nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { RunnableShortcut, ShortcutContext, ShortcutOptions } from "#core/index";

describe("@stackra/shortcuts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "Shortcut",
      "ShortcutConflictKind",
      "contributeShortcutContext",
      "findShortcutConflicts",
      "registerShortcuts",
    ]);
  });

  it("exports the types the template and gen use", () => {
    expectTypeOf<ShortcutContext>().toBeObject();
    expectTypeOf<ShortcutOptions["group"]>().toEqualTypeOf<string>();
    expectTypeOf<RunnableShortcut["run"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });
});
