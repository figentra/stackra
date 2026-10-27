/**
 * Stackra file contract:
 * Purpose: proves the web KdsBoard ages each ticket in the tone of the caller's steps, shows its flags and lines,
 *          bumps a ticket and a line, recalls, and shows the all-day counts of the lines still to make.
 * Boundary: jsdom with the real `@stackra/ui` Button and Chip; the English catalogue answers the board's words.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import { KdsBoard } from "#react/kds-board/kds-board";

const now = 1_000 * 60_000;
const tickets = [
  {
    id: "k1",
    title: "Table 12",
    subtitle: "Sara",
    sentAt: now - 12 * 60_000,
    isRush: true,
    items: [
      { id: "a", quantity: 2, name: "Burger", notes: ["No onion"], hasAllergy: true },
      { id: "b", quantity: 1, name: "Fries", isDone: true },
    ],
  },
  {
    id: "k2",
    title: "#1043",
    sentAt: now - 60_000,
    items: [{ id: "c", quantity: 1, name: "Burger" }],
  },
];
const props = {
  label: "Grill",
  tickets,
  now,
  ageTones: [
    { fromMinutes: 5, tone: "warning" as const },
    { fromMinutes: 10, tone: "danger" as const },
  ],
  formatAge: (minutes: number) => `${minutes} min`,
};

describe("KdsBoard (web)", () => {
  it("ages each ticket and shows its flags and lines", () => {
    const { container } = render(<KdsBoard {...props} />);
    const first = screen.getByRole("listitem", { name: "Table 12, 12 min" });
    expect(first.getAttribute("data-tone")).toBe("danger");
    expect(container.querySelector("[data-ticket='k2']")?.getAttribute("data-tone")).toBe(
      "default",
    );
    expect(within(first).getByText("Rush")).toBeTruthy();
    expect(within(first).getByText("No onion")).toBeTruthy();
    expect(
      within(first)
        .getByRole("button", { name: /1 × Fries/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.queryByRole("button", { name: "Bump" })).toBeNull();
  });

  it("bumps a ticket and a line and recalls", () => {
    const onBump = vi.fn();
    const onItemBump = vi.fn();
    const onRecall = vi.fn();
    render(<KdsBoard {...props} onBump={onBump} onItemBump={onItemBump} onRecall={onRecall} />);
    const first = screen.getByRole("listitem", { name: "Table 12, 12 min" });
    fireEvent.click(within(first).getByRole("button", { name: "Bump" }));
    expect(onBump).toHaveBeenCalledWith("k1");
    fireEvent.click(within(first).getByRole("button", { name: /2 × Burger/ }));
    expect(onItemBump).toHaveBeenCalledWith("k1", "a");
    fireEvent.click(screen.getByRole("button", { name: "Recall" }));
    expect(onRecall).toHaveBeenCalledOnce();
  });

  it("shows the all-day counts of the lines still to make", () => {
    render(<KdsBoard {...props} showAllDay />);
    const allDay = screen.getByRole("region", { name: "All day" });
    expect(within(allDay).getByText("3 × Burger")).toBeTruthy();
    expect(within(allDay).queryByText(/Fries/)).toBeNull();
  });
});
