/**
 * Stackra file contract:
 * Purpose: unit tests of `registerShortcutTestingPart`: parts are kept by name in registration order, registering a
 *          name again replaces the part and moves it last, and the disposer removes only the part it registered.
 * Boundary: test only; reads `SHORTCUT_TESTING_PARTS` and resets it before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { SHORTCUT_TESTING_PARTS } from "#testing/constants/shortcut-testing-parts.constant";
import { registerShortcutTestingPart } from "#testing/functions/register-shortcut-testing-part.function";

/** Three distinct parts, told apart by identity. */
const first = () => ({});
const second = () => ({});
const replaced = () => ({});

beforeEach(() => {
  SHORTCUT_TESTING_PARTS.clear();
});

describe("registerShortcutTestingPart", () => {
  it("keeps parts by name and moves a re-registered name last", () => {
    registerShortcutTestingPart("theming", first);
    registerShortcutTestingPart("navigation", second);
    registerShortcutTestingPart("theming", replaced);
    expect([...SHORTCUT_TESTING_PARTS]).toEqual([
      ["navigation", second],
      ["theming", replaced],
    ]);
  });

  it("removes only the part its disposer registered", () => {
    const dispose = registerShortcutTestingPart("theming", first);
    registerShortcutTestingPart("theming", replaced);
    dispose();
    expect(SHORTCUT_TESTING_PARTS.get("theming")).toBe(replaced);
    const disposeReplaced = registerShortcutTestingPart("navigation", second);
    disposeReplaced();
    expect(SHORTCUT_TESTING_PARTS.has("navigation")).toBe(false);
  });
});
