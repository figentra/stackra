/**
 * Stackra file contract:
 * Purpose: proves the spinner page titles the document, shows one named status per size and per tone, leaves the
 *          spinner beside text silent, and runs its start-and-stop example: the labelled status appears, then goes and
 *          the result is written to the output.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and fake timers; the theme CSS is not
 *          loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-046 sta-350:P-035
import { Size, TextTone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Spinner } from "#src/routes/spinner/spinner";
import { SpinnerRoute } from "#src/routes/spinner/spinner.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Spinner />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Spinner page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /spinner under Status", () => {
    renderPage();
    expect(SpinnerRoute.path).toBe("/spinner");
    expect(SpinnerRoute.category).toBe("Status");
    expect(screen.getByRole("heading", { level: 1, name: "Spinner" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Spinner · Stackra Playground");
  });

  it("shows one named status per size and per tone", () => {
    renderPage();
    const sizes = section("Sizes");
    for (const size of Size)
      expect(sizes.getByRole("status", { name: `Loading, ${size}` })).toBeTruthy();
    const tones = section("Tones");
    for (const tone of TextTone)
      expect(tones.getByRole("status", { name: `Loading, ${tone}` })).toBeTruthy();
  });

  it("leaves the spinner beside text silent", () => {
    renderPage();
    const beside = section("Beside text");
    expect(beside.queryByRole("status")).toBeNull();
    expect(beside.getByText("Loading results…")).toBeTruthy();
  });

  it("shows a labelled status while loading, then removes it and announces the result", () => {
    renderPage();
    const action = section("Start and stop");
    expect(action.queryByRole("status", { name: "Loading orders" })).toBeNull();
    act(() => action.getByRole("button", { name: "Load orders" }).click());
    expect(action.getByRole("status", { name: "Loading orders" })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(action.queryByRole("status", { name: "Loading orders" })).toBeNull();
    expect(action.getByText("Orders loaded")).toBeTruthy();
  });
});
