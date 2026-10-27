/**
 * Stackra file contract:
 * Purpose: proves the switch page titles the document, shows one switch per state with its caption, names a
 *          label-less switch, hides the error message once the invalid sample is on, and drives the live settings and
 *          their readout.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-082 sta-350:FR-086 sta-350:FR-089
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Switch } from "#src/routes/switch/switch";
import { SwitchRoute } from "#src/routes/switch/switch.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Switch />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const control = (name: string | RegExp) => screen.getByRole("switch", { name }) as HTMLInputElement;

describe("Switch page", () => {
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

  it("titles the page and the document, and sits at /switch under Selection", () => {
    renderPage();
    expect(routePath(SwitchRoute)).toBe("/switch");
    expect(SwitchRoute.category).toBe("Selection");
    expect(screen.getByRole("heading", { level: 1, name: "Switch" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Switch · Stackra Playground");
  });

  it("shows one switch per state, each under its caption", () => {
    renderPage();
    const states = section("States");
    expect(states.getAllByRole("switch")).toHaveLength(8);
    expect(states.getByText("Disabled and on")).toBeTruthy();
    expect(control("Airplane mode").checked).toBe(false);
    expect(control("Wi-Fi").checked).toBe(true);
    expect(control("Bluetooth").disabled).toBe(true);
    expect(control("Location services")).toMatchObject({ disabled: true, checked: true });
    expect(control("Cloud backup").checked).toBe(true);
    expect(control(/Allow the app to run in the background/).required).toBe(true);
  });

  it("shows a description with its switch and the error message of the invalid sample until it is on", () => {
    renderPage();
    expect(screen.getByText("Get an alert when an order ships.")).toBeTruthy();
    expect(screen.getByText("Turn this on to continue.")).toBeTruthy();
    fireEvent.click(control("Share my profile"));
    expect(screen.queryByText("Turn this on to continue.")).toBeNull();
  });

  it("names a switch that has no visible label by its aria-label", () => {
    renderPage();
    expect(
      section("Without a visible label").getByRole("switch", { name: "Mute all sounds" }),
    ).toBeTruthy();
  });

  it("lists the settings that are on in the readout, as they change", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByRole("status").textContent).toBe("On: Dark theme");
    fireEvent.click(live.getByRole("switch", { name: "Beta features" }));
    expect(live.getByRole("status").textContent).toBe("On: Dark theme, Beta features");
    fireEvent.click(live.getByRole("switch", { name: "Dark theme" }));
    fireEvent.click(live.getByRole("switch", { name: "Beta features" }));
    expect(live.getByRole("status").textContent).toBe("On: nothing");
  });
});
