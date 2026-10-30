/**
 * Stackra file contract:
 * Purpose: proves the web MultiSelect folds chips past `maxVisible` into one "+N" chip named by what it hides, and
 *          that "Select all" chooses every enabled option.
 * Boundary: jsdom with the real HeroUI and React Aria components; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { MultiSelect } from "#react/multi-select/multi-select";

const CITIES = [
  { id: "ruh", label: "Riyadh" },
  { id: "jed", label: "Jeddah" },
  { id: "dmm", label: "Dammam" },
  { id: "abh", label: "Abha", isDisabled: true },
];

describe("MultiSelect extras (web)", () => {
  it("folds the chips past maxVisible into +N", () => {
    render(<MultiSelect label="Cities" items={CITIES} defaultValue={["ruh", "jed", "dmm"]} maxVisible={1} />);
    expect(screen.getByText("+2")).toBeTruthy();
    expect(screen.getByRole("row", { name: "2 more: Jeddah, Dammam" })).toBeTruthy();
  });

  it("selects every enabled option", () => {
    const seen: (readonly string[])[] = [];
    const { container } = render(
      <MultiSelect label="Cities" items={CITIES} hasSelectAll onChange={(keys) => seen.push(keys)} />,
    );
    fireEvent.click(container.querySelector('button[aria-haspopup="listbox"]') as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(seen.at(-1)).toEqual(["ruh", "jed", "dmm"]);
  });
});
