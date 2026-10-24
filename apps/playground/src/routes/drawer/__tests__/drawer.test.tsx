/**
 * Stackra file contract:
 * Purpose: proves the drawer page titles the document, shows a trigger for every edge and dismissal setting, opens the
 *          start, end, top and bottom drawers on the edges HeroUI names for them in left-to-right, keeps a drawer with
 *          outside press off open on a press outside and one with Escape off open on Escape, scrolls a long body that
 *          a keyboard user can reach, and in the live example keeps the setting on Apply and the old one on Cancel.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so classes
 *           are checked, not looks, and the mirrored edges in right-to-left, focus return and the real layout are the
 *           e2e suite's. A role query finds nothing outside an open drawer (React Aria hides the page behind it), so
 *           each case holds what it needs before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-101
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { Drawer } from "#src/routes/drawer/drawer";
import { DrawerRoute } from "#src/routes/drawer/drawer.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Drawer />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

/** A press on the open drawer's backdrop, sent as pointer and mouse events so either path of React Aria sees it. */
const pressOutside = () =>
  act(() => {
    const target = document.querySelector('[data-slot="drawer-backdrop"]');
    if (!target) throw new Error("no drawer is open");
    for (const type of ["pointerDown", "pointerUp", "mouseDown", "mouseUp", "click"] as const)
      fireEvent[type](target);
  });

/** The edge HeroUI drew the open drawer on. */
const edge = () =>
  screen
    .getByRole("dialog")
    .closest('[data-slot="drawer-content"]')
    ?.getAttribute("data-placement");

describe("Drawer page", () => {
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

  it("titles the page and the document, and sits at /drawer under Overlays", () => {
    renderPage();
    expect(DrawerRoute.path).toBe("/drawer");
    expect(DrawerRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Drawer" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Drawer · Stackra Playground");
  });

  it("shows a trigger for every edge and dismissal setting, and the long and live examples", () => {
    renderPage();
    for (const name of ["Open from start", "Open from end", "Open from top", "Open from bottom"])
      expect(section("Placement").getByRole("button", { name })).toBeTruthy();
    for (const name of ["Open default", "Open with outside press off", "Open with Escape off"])
      expect(section("Dismissal").getByRole("button", { name })).toBeTruthy();
    expect(section("Long content").getByRole("button", { name: "Open long content" })).toBeTruthy();
    expect(section("Try it").getByRole("button", { name: "Open settings" })).toBeTruthy();
  });

  it.each([
    ["Open from start", "left"],
    ["Open from end", "right"],
    ["Open from top", "top"],
    ["Open from bottom", "bottom"],
  ] as const)("opens %s on the %s edge in left-to-right", (name, expected) => {
    renderPage();
    press(section("Placement").getByRole("button", { name }));
    expect(screen.getByRole("dialog", { name: "Drawer placement" })).toBeTruthy();
    expect(edge()).toBe(expected);
  });

  it("closes the default drawer on a press outside it", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Open default" }));
    pressOutside();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the drawer with outside press off open on a press outside, and closes it from Cancel", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Open with outside press off" }));
    pressOutside();
    expect(screen.getByRole("dialog", { name: "Drawer dismissal" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the drawer with Escape off open on Escape, and closes it from Close", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Open with Escape off" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Drawer dismissal" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("scrolls a long body that the keyboard can reach", () => {
    renderPage();
    press(section("Long content").getByRole("button", { name: "Open long content" }));
    const dialog = within(screen.getByRole("dialog", { name: "Activity log" }));
    const body = document.querySelector('[data-slot="drawer-body"]');
    expect(body?.getAttribute("tabindex")).toBe("0");
    expect(body?.querySelectorAll("p")).toHaveLength(30);
    expect(dialog.getByRole("button", { name: "Done" })).toBeTruthy();
  });

  it("keeps the new setting on Apply and the old one on Cancel", () => {
    renderPage();
    const live = section("Try it");
    const open = live.getByRole("button", { name: "Open settings" });
    const status = live.getByRole("status");
    expect(status.textContent).toBe("Notifications: on");
    press(open);
    press(screen.getByRole("switch", { name: "Email notifications" }));
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(status.textContent).toBe("Notifications: on");
    press(open);
    expect(screen.getByRole("switch", { name: "Email notifications" })).toHaveProperty(
      "checked",
      true,
    );
    press(screen.getByRole("switch", { name: "Email notifications" }));
    press(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(status.textContent).toBe("Notifications: off");
  });
});
