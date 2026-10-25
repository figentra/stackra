/**
 * Stackra file contract:
 * Purpose: unit tests of `TerminalState`: ready, busy or offline.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TerminalState } from "#contracts/enums/terminal-state.enum";

describe("TerminalState", () => {
  it("has the three states", () => {
    expect(Enum.values(TerminalState)).toEqual(["ready", "busy", "offline"]);
  });
});
