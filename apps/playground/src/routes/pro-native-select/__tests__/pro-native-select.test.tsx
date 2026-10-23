/**
 * Stackra file contract:
 * Purpose: proves the NativeSelect page sits at /pro-native-select in the Pro group, titles the page and the document,
 *          draws five named selects, reports the item chosen in the controlled one, and disables the last.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProNativeSelect } from "#src/routes/pro-native-select/pro-native-select";
import { ProNativeSelectRoute } from "#src/routes/pro-native-select/pro-native-select.route";

describe("ProNativeSelect", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-native-select in the Pro group, and titles the page and the document", () => {
    render(<ProNativeSelect />);
    expect(ProNativeSelectRoute.path).toBe("/pro-native-select");
    expect(ProNativeSelectRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProNativeSelectRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("NativeSelect · Stackra Playground");
  });

  it("draws five named selects, and disables the last", () => {
    render(<ProNativeSelect />);
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
    for (const name of ["State", "Primary status", "Secondary status", "Department"])
      expect(screen.getByRole("combobox", { name })).toBeTruthy();
    expect((screen.getByRole("combobox", { name: "Priority" }) as HTMLSelectElement).disabled).toBe(
      true,
    );
  });

  it("reports the item chosen in the controlled select", () => {
    render(<ProNativeSelect />);
    expect(screen.getByRole("status").textContent).toBe("State: California.");
    fireEvent.change(screen.getByRole("combobox", { name: "State" }), {
      target: { value: "texas" },
    });
    expect(screen.getByRole("status").textContent).toBe("State: Texas.");
  });
});
