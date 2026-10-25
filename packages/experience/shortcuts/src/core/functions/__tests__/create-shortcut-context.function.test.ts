/**
 * Stackra file contract:
 * Purpose: unit tests of `createShortcutContext`: an empty object with no part contributed, and a fresh object per run
 *          that merges every part in contribution order.
 * Boundary: test only; writes the parts set directly and resets it before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 17 and 23).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import { createShortcutContext } from "#core/functions/create-shortcut-context.function";

beforeEach(() => {
  SHORTCUT_CONTEXT_PARTS.clear();
});

describe("createShortcutContext", () => {
  it("is empty when nothing contributes", () => {
    expect(createShortcutContext()).toEqual({});
  });

  it("merges the parts into a fresh object per run", () => {
    SHORTCUT_CONTEXT_PARTS.add(() => ({ a: 1 }) as never);
    SHORTCUT_CONTEXT_PARTS.add(() => ({ b: 2 }) as never);
    const first = createShortcutContext();
    expect(first).toEqual({ a: 1, b: 2 });
    expect(createShortcutContext()).not.toBe(first);
  });
});
