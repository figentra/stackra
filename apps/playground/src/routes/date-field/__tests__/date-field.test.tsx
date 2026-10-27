/**
 * Stackra file contract:
 * Purpose: proves the date-field page titles the document, shows an empty and a filled field, a field bounded to one
 *          month that turns invalid when stepped out of it, a field whose own rule flags a Saturday, the read-only and
 *          disabled states, and that the live field shows the day it holds once its three segments are set.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-208 sta-350:P-079
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { DateField } from "#src/routes/date-field/date-field";
import { DateFieldRoute } from "#src/routes/date-field/date-field.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <DateField />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
/** The text of each segment, for example `["3", "5", "2026"]`. */
const shown = (segments: readonly HTMLElement[]) => segments.map((segment) => segment.textContent);
const step = (segment: HTMLElement) => fireEvent.keyDown(segment, { key: "ArrowUp" });

describe("Date field page", () => {
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

  it("titles the page and the document, and sits at /date-field under Date and time", () => {
    renderPage();
    expect(routePath(DateFieldRoute)).toBe("/date-field");
    expect(DateFieldRoute.category).toBe("Date and time");
    expect(screen.getByRole("heading", { level: 1, name: "Date field" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Date field · Stackra Playground");
  });

  it("shows an empty field and a filled one", () => {
    renderPage();
    const basics = section("Basics");
    const empty = basics.getAllByRole("spinbutton", { name: /Start date/ });
    expect(shown(empty)).toEqual(["mm", "dd", "yyyy"]);
    const filled = basics.getAllByRole("spinbutton", { name: /Due date/ });
    expect(shown(filled)).toEqual(["3", "5", "2026"]);
    expect(basics.getByText("The day the invoice is due.")).toBeTruthy();
  });

  it("shows a bounded field that turns invalid when stepped out of its month", () => {
    renderPage();
    const bounded = section("Bounded");
    const [month] = bounded.getAllByRole("spinbutton", { name: /Booking date/ });
    expect(bounded.queryByText("Pick a day in March 2026.")).toBeNull();
    step(month as HTMLElement);
    expect(bounded.getByText("Pick a day in March 2026.")).toBeTruthy();
    expect(month?.getAttribute("aria-invalid")).toBe("true");
  });

  it("shows a weekend day flagged by the field's own rule, and the read-only and disabled states", () => {
    renderPage();
    const states = section("States");
    const [invalidMonth] = states.getAllByRole("spinbutton", { name: /Delivery date/ });
    expect(invalidMonth?.getAttribute("aria-invalid")).toBe("true");
    expect(states.getByText("We do not deliver at weekends.")).toBeTruthy();
    const [readOnlyMonth] = states.getAllByRole("spinbutton", { name: /Signed on/ });
    expect(readOnlyMonth?.getAttribute("aria-readonly")).toBe("true");
    const disabled = states.getAllByRole("spinbutton", { name: /Cancelled on/ });
    expect(disabled.every((segment) => segment.getAttribute("aria-disabled") === "true")).toBe(
      true,
    );
    expect(shown(disabled)).toEqual(["1", "20", "2026"]);
  });

  it("shows the live field's day once its three segments are set", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByTestId("date-field-value").textContent).toBe("No day chosen yet.");
    const segments = live.getAllByRole("spinbutton", { name: /Check-in date/ });
    expect(segments).toHaveLength(3);
    for (const segment of segments) step(segment);
    expect(live.getByTestId("date-field-value").textContent).toMatch(
      /^Chosen day: \d{4}-\d{2}-\d{2}$/,
    );
  });
});
