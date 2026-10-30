/**
 * Stackra file contract:
 * Purpose: proves the native Timeline names itself, writes the day headings as headers and shows the bodies only in
 *          the default variant.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text and SlotIcon are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Timeline } from "#native/timeline/timeline";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));

const ITEMS = [
  {
    id: "1",
    actor: "Sara",
    title: "approved the quote",
    at: "2026-10-29T08:10:00+03:00",
    body: "Within budget.",
  },
  { id: "2", title: "Order created", at: "2026-10-28T10:00:00+03:00" },
];

describe("Timeline (native)", () => {
  it("names itself and writes Today and Yesterday as headers", () => {
    render(
      <Timeline items={ITEMS} now={new Date("2026-10-29T09:00:00+03:00")} timeZone="Asia/Riyadh" />,
    );
    expect(screen.getByLabelText("Activity")).toBeTruthy();
    expect(screen.getAllByRole("header").map((h) => h.textContent)).toEqual(["Today", "Yesterday"]);
    expect(screen.getByText("Within budget.")).toBeTruthy();
  });

  it("hides the bodies when compact", () => {
    render(<Timeline items={ITEMS} variant="compact" />);
    expect(screen.queryByText("Within budget.")).toBeNull();
  });
});
