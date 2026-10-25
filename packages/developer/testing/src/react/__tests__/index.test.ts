// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: exactly `render`, `renderHook`, `userEvent`, Testing
 *          Library's own `screen`, `within` and `act`, and navigation's route helpers (the same objects, not copies).
 * Boundary: test only; imports the stand-in barrel through its `#react` alias. `@stackra/navigation/testing` is mocked:
 *           it is an optional peer this package does not install (navigation's tests depend on this package).
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { act, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import * as entry from "#react/index";

const navigation = vi.hoisted(() => ({
  renderLayout: vi.fn(),
  renderRoute: vi.fn(),
  routeMeta: vi.fn(),
  runRouteLoader: vi.fn(),
  runRouteSubmit: vi.fn(),
}));

vi.mock("@stackra/navigation/testing", () => navigation);

describe("@stackra/testing/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "act",
      "render",
      "renderHook",
      "renderLayout",
      "renderRoute",
      "routeMeta",
      "runRouteLoader",
      "runRouteSubmit",
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

  it("re-exports navigation's route helpers", () => {
    expect(entry.renderRoute).toBe(navigation.renderRoute);
    expect(entry.renderLayout).toBe(navigation.renderLayout);
    expect(entry.routeMeta).toBe(navigation.routeMeta);
    expect(entry.runRouteLoader).toBe(navigation.runRouteLoader);
    expect(entry.runRouteSubmit).toBe(navigation.runRouteSubmit);
  });
});
