/**
 * Stackra file contract:
 * Purpose: proves the date-picker page titles the document, names each calendar button, opens the filled picker's calendar
 *          on its month, stops the bounded picker's calendar at the end of its month, flags a Saturday through the picker's
 *          own rule and shows weekends as unavailable in its calendar, keeps the read-only and disabled pickers closed, and
 *          that the live picker is opened from outside, reports its open state, and shows the day chosen in its calendar.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0312; ADR 0318 (decision 7); ADR 0022 (test
 *          placement).
 */
// @covers sta-350:FR-208 sta-350:P-079
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { DatePicker } from "#src/routes/date-picker/date-picker";
import { DatePickerRoute } from "#src/routes/date-picker/date-picker.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <DatePicker />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
/** The segments of the picker with this label, in the order they are drawn. */
const segmentsOf = (scope: ReturnType<typeof section>, label: string) =>
  scope.getAllByRole("spinbutton", { name: new RegExp(label) });

describe("Date picker page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /date-picker under Date and time", () => {
    renderPage();
    expect(DatePickerRoute.path).toBe("/date-picker");
    expect(DatePickerRoute.category).toBe("Date and time");
    expect(screen.getByRole("heading", { level: 1, name: "Date picker" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Date picker · Stackra Playground");
  });

  it("shows an empty picker and a filled one, each calendar button named for its day", () => {
    renderPage();
    const basics = section("Basics");
    expect(segmentsOf(basics, "Start date").map((segment) => segment.textContent)).toEqual([
      "mm",
      "dd",
      "yyyy",
    ]);
    expect(segmentsOf(basics, "Due date").map((segment) => segment.textContent)).toEqual([
      "3",
      "5",
      "2026",
    ]);
    expect(basics.getByRole("button", { name: /^Choose the start date/ })).toBeTruthy();
    expect(basics.getByRole("button", { name: /^Choose the due date/ })).toBeTruthy();
  });

  it("opens the filled picker's calendar on its month, as a dialog named by its button", () => {
    renderPage();
    press(section("Basics").getByRole("button", { name: /^Choose the due date/ }));
    const dialog = screen.getByRole("dialog", { name: "Choose the due date" });
    expect(within(dialog).getByRole("grid", { name: "March 2026" })).toBeTruthy();
  });

  it("stops the bounded picker's calendar at the end of its month", () => {
    renderPage();
    press(section("Bounded").getByRole("button", { name: /^Choose the booking date/ }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getAllByRole("button", { name: "Next" })[0]?.hasAttribute("disabled")).toBe(true);
    expect(dialog.getAllByRole("button", { name: "Previous" })[0]?.hasAttribute("disabled")).toBe(
      true,
    );
  });

  it("flags a Saturday through the picker's own rule, and shows weekends as unavailable", () => {
    renderPage();
    const states = section("States");
    const [month] = segmentsOf(states, "Delivery date");
    expect(month?.getAttribute("aria-invalid")).toBe("true");
    expect(states.getByText("We do not deliver at weekends.")).toBeTruthy();
    press(states.getByRole("button", { name: /^Choose the delivery date/ }));
    const grid = within(screen.getByRole("grid", { name: "March 2026" }));
    expect(
      grid.getByRole("button", { name: /^Saturday, March 7/ }).hasAttribute("data-unavailable"),
    ).toBe(true);
    expect(
      grid.getByRole("button", { name: /^Monday, March 9/ }).hasAttribute("data-unavailable"),
    ).toBe(false);
    // Four Saturdays and five Sundays; the days of April the grid pads with are not counted (the e2e file counts the same).
    expect(
      document.querySelectorAll('[data-unavailable="true"]:not([data-outside-month])'),
    ).toHaveLength(9);
  });

  it("keeps the read-only and disabled pickers closed with their days", () => {
    renderPage();
    const states = section("States");
    for (const label of ["Signed on", "Cancelled on"]) {
      const button = states.getByRole("button", { name: new RegExp(`${label}$`) });
      expect(button.hasAttribute("disabled")).toBe(true);
    }
    expect(segmentsOf(states, "Signed on")[0]?.getAttribute("aria-readonly")).toBe("true");
    expect(segmentsOf(states, "Cancelled on")[0]?.getAttribute("aria-disabled")).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the live picker from outside, reports it, and shows the day chosen in its calendar", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByTestId("date-picker-open").textContent).toBe("The calendar is closed.");
    expect(live.getByTestId("date-picker-value").textContent).toBe("No day chosen yet.");
    press(live.getByRole("button", { name: "Open the calendar" }));
    expect(screen.getByRole("dialog", { name: "Choose the check-in date" })).toBeTruthy();
    expect(screen.getByTestId("date-picker-open").textContent).toBe("The calendar is open.");
    const grid = within(screen.getByRole("grid", { name: "March 2026" }));
    press(grid.getByRole("button", { name: /^Friday, March 6, 2026/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(live.getByTestId("date-picker-open").textContent).toBe("The calendar is closed.");
    expect(live.getByTestId("date-picker-value").textContent).toBe("Chosen day: 2026-03-06");
  });
});
