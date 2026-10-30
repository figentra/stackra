/**
 * Stackra file contract:
 * Purpose: proves the web Timeline is a named region with Today, Yesterday and dated headings, isolates the actor,
 *          writes each time in a `<time>` with its instant, and drops the bodies in the compact variant.
 * Boundary: jsdom; English words from the catalogue, the time zone fixed to Riyadh.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Timeline } from "#react/timeline/timeline";

const ITEMS = [
  {
    id: "1",
    actor: "Sara Ali",
    title: "approved the quote",
    at: "2026-10-29T08:10:00+03:00",
    body: "Within budget.",
  },
  { id: "2", actor: "Omar", title: "uploaded the invoice", at: "2026-10-28T16:00:00+03:00" },
  { id: "3", title: "Order created", at: "2026-10-20T10:00:00+03:00" },
] as const;

describe("Timeline (web)", () => {
  it("groups under Today, Yesterday and the date, with actors isolated and times as <time>", () => {
    const { container } = render(
      <Timeline
        items={ITEMS}
        label="Order activity"
        now={new Date("2026-10-29T09:00:00+03:00")}
        timeZone="Asia/Riyadh"
      />,
    );
    expect(screen.getByRole("region", { name: "Order activity" })).toBeTruthy();
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Today",
      "Yesterday",
      "Oct 20, 2026",
    ]);
    expect(container.querySelector("bdi")?.textContent).toBe("Sara Ali");
    expect(container.querySelector("time")?.getAttribute("dateTime")).toBe(
      "2026-10-29T05:10:00.000Z",
    );
    expect(screen.getByText("Within budget.")).toBeTruthy();
  });

  it("drops the bodies when compact", () => {
    render(<Timeline items={ITEMS} variant="compact" groupByDay={false} />);
    expect(screen.queryByText("Within budget.")).toBeNull();
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });
});
