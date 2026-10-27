/**
 * Stackra file contract:
 * Purpose: proves the route-overlay page titles the document and sits at /route-overlay under Overlays; opens the
 *          modal, sheet, drawer and full-screen overlays as child routes of its in-memory router and shows each in its
 *          form; closes from the close button and Escape by stepping Back; opens an overlay through a `Link`; keeps
 *          the locked overlay open on Escape until dismissal is allowed again, while its close button always works;
 *          and in the live example saves the name and completes the route, asks before Cancel drops an edit, keeps the
 *          edit on Stay and drops it on Discard.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so data
 *           attributes are checked, not looks, and focus return is the e2e suite's. A role query finds nothing outside
 *           an open overlay (React Aria hides the page behind it), so route text is read with a text query.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-184
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { RouteOverlay } from "#src/routes/route-overlay/route-overlay";
import { RouteOverlayRoute } from "#src/routes/route-overlay/route-overlay.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <RouteOverlay />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const press = (name: string) => act(() => screen.getByRole("button", { name }).click());
const route = () => screen.getByText(/^Route: /).textContent;
const placement = () =>
  document.querySelector('[data-slot="drawer-content"]')?.getAttribute("data-placement");

describe("RouteOverlay page", () => {
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

  // The router commits its navigations outside act, so React can still hold a passive-effects flush in the scheduler
  // (a setImmediate that reads `window.event`); let it run before jsdom is torn down, or it throws on a busy runner.
  afterAll(() => new Promise((resolve) => setTimeout(resolve, 0)));

  it("titles the page and the document, and sits at /route-overlay under Overlays", () => {
    renderPage();
    expect(routePath(RouteOverlayRoute)).toBe("/route-overlay");
    expect(RouteOverlayRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Route overlay" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Route overlay · Stackra Playground");
    expect(route()).toBe("Route: /");
  });

  it("opens the modal as a child route and closes it by stepping Back", async () => {
    renderPage();
    press("Open modal");
    expect(screen.getByRole("dialog", { name: "Modal route" })).toBeTruthy();
    expect(route()).toBe("Route: /modal");
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(route()).toBe("Route: /");
  });

  it("closes on Escape", async () => {
    renderPage();
    press("Open modal");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("draws the sheet, the drawer and the full-screen overlay in their forms", async () => {
    renderPage();
    press("Open sheet");
    expect(screen.getByRole("dialog", { name: "Sheet route" })).toBeTruthy();
    expect(placement()).toBe("bottom");
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    press("Open drawer");
    expect(screen.getByRole("dialog", { name: "Drawer route" })).toBeTruthy();
    expect(placement()).toBe("right");
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    press("Open full screen");
    expect(
      screen
        .getByRole("dialog", { name: "Full-screen route" })
        .classList.contains("modal__dialog--full"),
    ).toBe(true);
  });

  it("opens an overlay through a Link, closing to the parent route", async () => {
    renderPage();
    act(() => screen.getByRole("link", { name: "Open the modal through a Link" }).click());
    expect(screen.getByRole("dialog", { name: "Modal route" })).toBeTruthy();
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(route()).toBe("Route: /");
  });

  it("keeps the locked overlay open on Escape until dismissal is allowed, and always closes from its button", async () => {
    renderPage();
    press("Open locked overlay");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Locked route" })).toBeTruthy();
    expect(screen.getByText("Escape and a press outside do nothing.")).toBeTruthy();

    press("Allow dismissal");
    expect(screen.getByText("Escape and a press outside close it again.")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    press("Open locked overlay");
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("saves the name and completes the route without asking", async () => {
    renderPage();
    press("Edit name");
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Grace Hopper" },
    });
    press("Save");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByText("Saved name: Grace Hopper")).toBeTruthy();
    expect(route()).toBe("Route: /");
  });

  it("asks before Cancel drops an edit, keeps it on Stay and drops it on Discard", async () => {
    renderPage();
    press("Edit name");
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Grace Hopper" },
    });
    press("Cancel");
    await screen.findByRole("alertdialog", { name: "Discard unsaved changes?" });
    press("Stay on page");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(route()).toBe("Route: /edit");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveProperty("value", "Grace Hopper");

    press("Cancel");
    await screen.findByRole("alertdialog", { name: "Discard unsaved changes?" });
    press("Discard changes");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(route()).toBe("Route: /");
    expect(screen.getByText("Saved name: Ada Lovelace")).toBeTruthy();
  });

  it("closes the live overlay without asking while nothing is edited", async () => {
    renderPage();
    press("Edit name");
    press("Cancel");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
