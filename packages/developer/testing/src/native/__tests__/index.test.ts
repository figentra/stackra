/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: exactly `render`, `renderHook`, `userEvent`, `axe`,
 *          `toHaveNoViolations` and the library's own `screen` and `act` (the same objects, not copies).
 * Boundary: test only; imports the stand-in barrel through its `#native` alias. React Native does not run in vitest, so
 *           React Native Testing Library is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as entry from "#native/index";

const library = vi.hoisted(() => ({
  act: vi.fn(),
  screen: {},
  render: vi.fn(),
  renderHook: vi.fn(),
  cleanup: vi.fn(),
  userEvent: { setup: vi.fn() },
}));

vi.mock("@testing-library/react-native/pure", () => library);

describe("@stackra/testing/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "act",
      "axe",
      "render",
      "renderHook",
      "screen",
      "toHaveNoViolations",
      "userEvent",
    ]);
  });

  it("re-exports the library's own screen and act", () => {
    expect(entry.screen).toBe(library.screen);
    expect(entry.act).toBe(library.act);
  });
});
