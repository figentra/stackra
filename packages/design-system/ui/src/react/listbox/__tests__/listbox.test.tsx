/**
 * Stackra file contract:
 * Purpose: proves the web Listbox is a listbox named by its label, chooses one option in single mode and several in
 *          multiple mode, and draws section headings.
 * Boundary: jsdom with the real HeroUI and React Aria components.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Listbox } from "#react/listbox/listbox";

const ITEMS = [
  { id: "ruh", label: "Riyadh" },
  { id: "jed", label: "Jeddah" },
  { id: "dmm", label: "Dammam" },
];

describe("Listbox (web)", () => {
  it("chooses one in single mode", () => {
    const seen: (readonly string[])[] = [];
    render(<Listbox label="Branch" items={ITEMS} onChange={(keys) => seen.push(keys)} />);
    expect(screen.getByRole("listbox", { name: "Branch" })).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Jeddah" }));
    expect(seen.at(-1)).toEqual(["jed"]);
  });

  it("chooses several in multiple mode and draws sections", () => {
    const seen: (readonly string[])[] = [];
    render(
      <Listbox
        label="Regions"
        selectionMode="multiple"
        defaultValue={["ruh"]}
        sections={[{ id: "central", title: "Central", items: ITEMS }]}
        onChange={(keys) => seen.push(keys)}
      />,
    );
    expect(screen.getByText("Central")).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Dammam" }));
    expect(seen.at(-1)).toEqual(["ruh", "dmm"]);
  });
});
