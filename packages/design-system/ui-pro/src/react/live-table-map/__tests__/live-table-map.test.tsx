/**
 * Stackra file contract:
 * Purpose: proves the web LiveTableMap names each table with its status, lines and suggestion, shows a label as text
 *          and hides a wall, reports a pressed table, and draws a table without a live state.
 * Boundary: jsdom with the real `@stackra/ui` Chip; the English catalogue answers "Suggested".
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { LiveTableMap } from "#react/live-table-map/live-table-map";

const items = [
  { id: "t1", shape: "round" as const, label: "T1", x: 0, y: 0, width: 2, height: 2 },
  { id: "t2", shape: "rectangle" as const, label: "T2", x: 3, y: 0, width: 2, height: 2 },
  { id: "w", shape: "wall" as const, label: "", x: 0, y: 5, width: 8, height: 1 },
  { id: "door", shape: "label" as const, label: "Door", x: 6, y: 3, width: 2, height: 1 },
];
const tables = [
  {
    id: "t1",
    statusLabel: "Seated",
    tone: "accent" as const,
    lines: ["42 min", "Sara"],
    isSuggested: true,
  },
];

describe("LiveTableMap (web)", () => {
  it("names each table with its live state and reports a press", () => {
    const onTablePress = vi.fn();
    const { container } = render(
      <LiveTableMap
        label="Main hall"
        columns={8}
        rows={6}
        items={items}
        tables={tables}
        onTablePress={onTablePress}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "T1, Seated, 42 min, Sara, Suggested" }));
    expect(onTablePress).toHaveBeenCalledWith("t1");
    expect(screen.getByRole("button", { name: "T2" })).toBeTruthy();
    expect(screen.getByText("Door")).toBeTruthy();
    expect(container.querySelector("[data-shape='wall']")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("disables the tables when nothing handles a press", () => {
    render(<LiveTableMap label="Main hall" columns={8} rows={6} items={items} tables={[]} />);
    expect((screen.getByRole("button", { name: "T1" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
