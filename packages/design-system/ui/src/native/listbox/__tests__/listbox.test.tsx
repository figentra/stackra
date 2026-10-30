/**
 * Stackra file contract:
 * Purpose: proves the native Listbox reads options as radios in single mode and checkboxes in multiple mode, with
 *          their state, and hands out the chosen ids.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text, Icon and haptics are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Listbox } from "#native/listbox/listbox";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));

const ITEMS = [
  { id: "a", label: "Riyadh" },
  { id: "b", label: "Jeddah" },
];

describe("Listbox (native)", () => {
  it("reads radios in single mode", () => {
    const seen: (readonly string[])[] = [];
    render(
      <Listbox
        label="Branch"
        items={ITEMS}
        defaultValue={["a"]}
        onChange={(keys) => seen.push(keys)}
      />,
    );
    expect(screen.getByRole("radio", { name: "Riyadh" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: "Jeddah" }));
    expect(seen).toEqual([["b"]]);
  });

  it("reads checkboxes in multiple mode", () => {
    const seen: (readonly string[])[] = [];
    render(
      <Listbox
        label="Branches"
        selectionMode="multiple"
        items={ITEMS}
        defaultValue={["a"]}
        onChange={(keys) => seen.push(keys)}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Jeddah" }));
    expect(seen).toEqual([["a", "b"]]);
  });
});
