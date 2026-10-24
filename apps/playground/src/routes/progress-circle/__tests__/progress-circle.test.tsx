/**
 * Stackra file contract:
 * Purpose: proves the progress circle page titles the document, shows one named progressbar per size and per tone,
 *          shows the determinate rings with their values and the indeterminate one without, names the ring beside text,
 *          and runs its advance-and-reset example: the value follows the presses and the completion is written to the
 *          output.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-120
import { Size, Tone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { ProgressCircle } from "#src/routes/progress-circle/progress-circle";
import { ProgressCircleRoute } from "#src/routes/progress-circle/progress-circle.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <ProgressCircle />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("ProgressCircle page", () => {
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

  it("titles the page and the document, and sits at /progress-circle under Feedback and status", () => {
    renderPage();
    expect(ProgressCircleRoute.path).toBe("/progress-circle");
    expect(ProgressCircleRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: "Progress circle" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Progress circle · Stackra Playground");
  });

  it("shows one named progressbar per size and per tone", () => {
    renderPage();
    const sizes = section("Sizes");
    for (const size of Size)
      expect(sizes.getByRole("progressbar", { name: `Sync, ${size}` })).toBeTruthy();
    const tones = section("Tones");
    for (const tone of Tone)
      expect(tones.getByRole("progressbar", { name: `Sync, ${tone}` })).toBeTruthy();
  });

  it("shows the determinate rings with their values and the indeterminate one without", () => {
    renderPage();
    const determinate = section("Determinate");
    for (const step of [0, 25, 50, 75, 100])
      expect(
        determinate
          .getByRole("progressbar", { name: `Sync at ${step} per cent` })
          .getAttribute("aria-valuenow"),
      ).toBe(String(step));
    const ring = section("Indeterminate").getByRole("progressbar", { name: "Preparing sync" });
    expect(ring.hasAttribute("aria-valuenow")).toBe(false);
  });

  it("names the ring beside text and leaves the number to the text", () => {
    renderPage();
    const beside = section("Beside text");
    expect(beside.getByRole("progressbar", { name: "Syncing contacts" })).toBeTruthy();
    expect(beside.getByText("6 of 8 contacts")).toBeTruthy();
  });

  it("advances, announces the completion at the end and resets", () => {
    renderPage();
    const action = section("Advance and reset");
    const ring = () => action.getByRole("progressbar", { name: "Sync progress" });
    expect(ring().getAttribute("aria-valuenow")).toBe("0");
    act(() => action.getByRole("button", { name: "Advance by 10%" }).click());
    expect(ring().getAttribute("aria-valuenow")).toBe("10");
    for (let press = 0; press < 12; press += 1)
      act(() => action.getByRole("button", { name: "Advance by 10%" }).click());
    expect(ring().getAttribute("aria-valuenow")).toBe("100");
    expect(action.getByText("Sync complete")).toBeTruthy();
    act(() => action.getByRole("button", { name: "Reset" }).click());
    expect(ring().getAttribute("aria-valuenow")).toBe("0");
    expect(action.queryByText("Sync complete")).toBeNull();
  });
});
