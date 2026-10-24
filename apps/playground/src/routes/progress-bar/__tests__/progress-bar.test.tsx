/**
 * Stackra file contract:
 * Purpose: proves the progress bar page titles the document, shows one named progressbar per size and per tone, shows
 *          the determinate bars with their values and the indeterminate one without, draws the visible label and the
 *          value text, and runs its advance-and-reset example: the value and its text follow the presses and the
 *          completion is written to the output.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-120
import { Size, Tone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { ProgressBar } from "#src/routes/progress-bar/progress-bar";
import { ProgressBarRoute } from "#src/routes/progress-bar/progress-bar.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <ProgressBar />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("ProgressBar page", () => {
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

  it("titles the page and the document, and sits at /progress-bar under Feedback", () => {
    renderPage();
    expect(ProgressBarRoute.path).toBe("/progress-bar");
    expect(ProgressBarRoute.category).toBe("Feedback");
    expect(screen.getByRole("heading", { level: 1, name: "Progress bar" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Progress bar · Stackra Playground");
  });

  it("shows one named progressbar per size and per tone", () => {
    renderPage();
    const sizes = section("Sizes");
    for (const size of Size)
      expect(sizes.getByRole("progressbar", { name: `Upload, ${size}` })).toBeTruthy();
    const tones = section("Tones");
    for (const tone of Tone)
      expect(tones.getByRole("progressbar", { name: `Upload, ${tone}` })).toBeTruthy();
  });

  it("shows the determinate bars with their values and the indeterminate one without", () => {
    renderPage();
    const determinate = section("Determinate");
    for (const step of [0, 40, 100])
      expect(
        determinate
          .getByRole("progressbar", { name: `Upload at ${step} per cent` })
          .getAttribute("aria-valuenow"),
      ).toBe(String(step));
    const bar = section("Indeterminate").getByRole("progressbar", { name: "Preparing upload" });
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
  });

  it("draws the visible label and the value text, the caller's text included", () => {
    renderPage();
    const text = section("Label and value");
    expect(text.getByRole("progressbar", { name: "Storage used" })).toBeTruthy();
    expect(text.getByText("Storage used")).toBeTruthy();
    expect(text.getByText("72%")).toBeTruthy();
    expect(
      text.getByRole("progressbar", { name: "Uploading invoices" }).getAttribute("aria-valuetext"),
    ).toBe("3 of 12 files");
    expect(text.getByText("3 of 12 files")).toBeTruthy();
  });

  it("advances, announces the completion at the end and resets", () => {
    renderPage();
    const action = section("Advance and reset");
    const bar = () => action.getByRole("progressbar", { name: "Upload progress" });
    expect(bar().getAttribute("aria-valuenow")).toBe("0");
    act(() => action.getByRole("button", { name: "Advance by 10%" }).click());
    expect(bar().getAttribute("aria-valuenow")).toBe("10");
    expect(bar().getAttribute("aria-valuetext")).toBe("10%");
    for (let press = 0; press < 12; press += 1)
      act(() => action.getByRole("button", { name: "Advance by 10%" }).click());
    expect(bar().getAttribute("aria-valuenow")).toBe("100");
    expect(action.getByText("Upload complete")).toBeTruthy();
    act(() => action.getByRole("button", { name: "Reset" }).click());
    expect(bar().getAttribute("aria-valuenow")).toBe("0");
    expect(action.queryByText("Upload complete")).toBeNull();
  });
});
