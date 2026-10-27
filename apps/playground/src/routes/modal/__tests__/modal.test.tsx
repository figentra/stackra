/**
 * Stackra file contract:
 * Purpose: proves the modal page titles the document, shows a trigger for every size, position and dismissal setting,
 *          opens the small and large modals at their sizes, keeps a modal with outside press off open on a press
 *          outside and one with Escape off open on Escape, scrolls a long body that a keyboard user can reach, and in
 *          the live example keeps the name on Save and the old one on Cancel.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so classes
 *           are checked, not looks, and focus return and the real layout are the e2e suite's. A role query finds
 *           nothing outside an open modal (React Aria hides the page behind it), so each case holds what it needs
 *           before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-101
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { Modal } from "#src/routes/modal/modal";
import { ModalRoute } from "#src/routes/modal/modal.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Modal />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

/** A press on the open modal's backdrop, sent as pointer and mouse events so either path of React Aria sees it. */
const pressOutside = () =>
  act(() => {
    const target = document.querySelector('[data-slot="modal-backdrop"]');
    if (!target) throw new Error("no modal is open");
    for (const type of ["pointerDown", "pointerUp", "mouseDown", "mouseUp", "click"] as const)
      fireEvent[type](target);
  });

describe("Modal page", () => {
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

  it("titles the page and the document, and sits at /modal under Overlays", () => {
    renderPage();
    expect(routePath(ModalRoute)).toBe("/modal");
    expect(ModalRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: "Modal" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Modal · Stackra Playground");
  });

  it("shows a trigger for every size, position and dismissal setting, and the long and live examples", () => {
    renderPage();
    for (const name of ["Open small", "Open medium", "Open large", "Open full"])
      expect(section("Sizes").getByRole("button", { name })).toBeTruthy();
    for (const name of ["Open auto", "Open top", "Open centre", "Open bottom"])
      expect(section("Position").getByRole("button", { name })).toBeTruthy();
    for (const name of ["Open default", "Open with outside press off", "Open with Escape off"])
      expect(section("Dismissal").getByRole("button", { name })).toBeTruthy();
    expect(section("Long content").getByRole("button", { name: "Open long content" })).toBeTruthy();
    expect(section("Try it").getByRole("button", { name: "Edit name" })).toBeTruthy();
  });

  it("opens the small and the large modal at their sizes", () => {
    renderPage();
    const small = section("Sizes").getByRole("button", { name: "Open small" });
    const large = section("Sizes").getByRole("button", { name: "Open large" });
    press(small);
    expect(
      screen.getByRole("dialog", { name: "Modal size" }).classList.contains("modal__dialog--sm"),
    ).toBe(true);
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    press(large);
    expect(
      screen.getByRole("dialog", { name: "Modal size" }).classList.contains("modal__dialog--lg"),
    ).toBe(true);
  });

  it("pins the top modal to the top of the screen", () => {
    renderPage();
    press(section("Position").getByRole("button", { name: "Open top" }));
    expect(
      screen
        .getByRole("dialog", { name: "Modal position" })
        .closest('[data-slot="modal-container"]')
        ?.getAttribute("data-placement"),
    ).toBe("top");
  });

  it("closes the default modal on a press outside it", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Open default" }));
    pressOutside();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the modal with outside press off open on a press outside, and closes it from Cancel", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Open with outside press off" }));
    pressOutside();
    expect(screen.getByRole("dialog", { name: "Modal dismissal" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the modal with Escape off open on Escape, and closes it from Close", () => {
    renderPage();
    press(section("Dismissal").getByRole("button", { name: "Open with Escape off" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Modal dismissal" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("scrolls a long body that the keyboard can reach", () => {
    renderPage();
    press(section("Long content").getByRole("button", { name: "Open long content" }));
    const dialog = within(screen.getByRole("dialog", { name: "Terms of use" }));
    const body = document.querySelector('[data-slot="modal-body"]');
    expect(body?.getAttribute("tabindex")).toBe("0");
    expect(body?.querySelectorAll("p")).toHaveLength(30);
    expect(dialog.getByRole("button", { name: "Done" })).toBeTruthy();
  });

  it("keeps the new name on Save and the old one on Cancel", () => {
    renderPage();
    const live = section("Try it");
    const edit = live.getByRole("button", { name: "Edit name" });
    const status = live.getByRole("status");
    expect(status.textContent).toBe("Current name: Ada Lovelace");
    press(edit);
    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "Grace Hopper" },
    });
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(status.textContent).toBe("Current name: Ada Lovelace");
    press(edit);
    expect((screen.getByRole("textbox", { name: "Full name" }) as HTMLInputElement).value).toBe(
      "Ada Lovelace",
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "Grace Hopper" },
    });
    press(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(status.textContent).toBe("Current name: Grace Hopper");
  });
});
