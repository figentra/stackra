/**
 * Stackra file contract:
 * Purpose: proves `cardTerminalModule` finds `StackraCardTerminal` on the Expo registry and answers `undefined` without
 *          a registry or without the module.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { cardTerminalModule } from "#native/functions/card-terminal-module.function";
import { CARD_TERMINAL_SDK } from "#native/__tests__/card-terminal-sdk.fixture";

describe("cardTerminalModule", () => {
  afterEach(CARD_TERMINAL_SDK.uninstall);

  it("reads the module from the registry when there is one", () => {
    expect(cardTerminalModule()).toBeUndefined();
    (globalThis as { expo?: unknown }).expo = { modules: {} };
    expect(cardTerminalModule()).toBeUndefined();
    const module = CARD_TERMINAL_SDK.install();
    expect(cardTerminalModule()).toBe(module);
  });
});
