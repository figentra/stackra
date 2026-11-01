/**
 * Stackra file contract:
 * Purpose: proves the web DataTable selects every row of the page on Mod+A while focus is inside the table.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider; keys dispatched with their `code`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0508.
 */
// @vitest-environment jsdom
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";

import { DataTable } from "#react/data-table/data-table";

const icons = defineIconRegistry({
  ellipsis: Ellipsis,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
});

const ORDERS = [
  { id: "o1", number: "#1001" },
  { id: "o2", number: "#1002" },
];

describe("DataTable shortcuts (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("selects all on Mod+A from inside the table", () => {
    render(
      <ShortcutProvider>
        <IconRegistryProvider registry={icons}>
          <DataTable
            label="Orders"
            items={ORDERS}
            columns={[{ id: "number", label: "Order" }]}
            selectionMode="multiple"
          />
        </IconRegistryProvider>
      </ShortcutProvider>,
    );
    const cell = screen.getByText("#1001");
    fireEvent.keyDown(cell, { key: "a", code: "KeyA", ctrlKey: true });
    const rows = screen.getAllByRole("row").slice(1);
    for (const row of rows) expect(row.getAttribute("aria-selected")).toBe("true");
  });
});
