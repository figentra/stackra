/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: exactly `render`, `renderHook`, `userEvent`, Testing
 *          Library's own `screen`, `within` and `act` (the same objects, not copies).
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0294 (decision 15).
 */
// @vitest-environment jsdom
import { describe, expect, it } from "@stackra/testing";
import { act, screen, within } from "@testing-library/react";

import * as entry from "#react/index";

describe("@stackra/testing/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "act",
      "render",
      "renderHook",
      "screen",
      "userEvent",
      "within",
    ]);
  });

  it("re-exports Testing Library's own screen, within and act", () => {
    expect(entry.screen).toBe(screen);
    expect(entry.within).toBe(within);
    expect(entry.act).toBe(act);
  });
});
