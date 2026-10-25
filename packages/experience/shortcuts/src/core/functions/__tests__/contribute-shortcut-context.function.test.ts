/**
 * Stackra file contract:
 * Purpose: unit tests of `contributeShortcutContext`: a part's members reach the context of the next run, read fresh
 *          per run, a later part wins a shared member, and the disposer removes only its own part.
 * Boundary: test only; reads the context through `createShortcutContext` and resets the parts before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 17 and 23).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import { contributeShortcutContext } from "#core/functions/contribute-shortcut-context.function";
import { createShortcutContext } from "#core/functions/create-shortcut-context.function";

/** A part contributed twice in one test. */
const part = () => ({ member: true }) as never;

beforeEach(() => {
  SHORTCUT_CONTEXT_PARTS.clear();
});

describe("contributeShortcutContext", () => {
  it("adds the part's members, read at each run", () => {
    let scheme = "light";
    contributeShortcutContext(() => ({ scheme }) as never);
    expect(createShortcutContext()).toEqual({ scheme: "light" });
    scheme = "dark";
    expect(createShortcutContext()).toEqual({ scheme: "dark" });
  });

  it("lets a later part win a member both supply", () => {
    contributeShortcutContext(() => ({ who: "first", only: 1 }) as never);
    contributeShortcutContext(() => ({ who: "second" }) as never);
    expect(createShortcutContext()).toEqual({ who: "second", only: 1 });
  });

  it("removes only its own part when disposed", () => {
    const first = contributeShortcutContext(part);
    contributeShortcutContext(part);
    first();
    expect(SHORTCUT_CONTEXT_PARTS.size).toBe(1);
    expect(createShortcutContext()).toEqual({ member: true });
  });
});
