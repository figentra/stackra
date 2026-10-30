/**
 * Stackra file contract:
 * Purpose: proves the web Table's density sets the cell padding and row height itself (32, 44 and 56 px) through
 *          element variants, never through HeroUI's `table__cell` class, whose underscores Tailwind reads as spaces.
 * Boundary: jsdom cannot lay out, so the classes are checked; the playground's end-to-end test measures the rows.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371 (batch C: table density); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Table } from "#react/table/table";

const ITEMS = [{ id: "o1", customer: "Ada" }];
const COLUMNS = [{ id: "customer", label: "Customer" }];

describe("Table density (web)", () => {
  it.each([
    ["compact", "[&_td]:h-8"],
    ["normal", "[&_td]:h-11"],
    ["roomy", "[&_td]:h-14"],
  ] as const)("gives %s rows their own height and padding", (density, height) => {
    render(<Table label="Orders" items={ITEMS} columns={COLUMNS} density={density} />);
    const root = screen.getByRole("grid").closest(".table-root");
    expect(root?.className).toContain(height);
    expect(root?.className).toMatch(/\[&_td\]:py-/);
    // An underscore inside the brackets would be read as a space and match nothing.
    expect(root?.className).not.toMatch(/\[&_\.[a-z-]+__/);
  });
});
