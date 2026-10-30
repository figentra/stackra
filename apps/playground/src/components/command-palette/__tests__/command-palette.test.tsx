/**
 * Stackra file contract:
 * Purpose: proves the command palette behaves as a launcher over the registry.
 *          - Empty, it opens as a modal dialog with a combobox over a listbox: recent pages, then the quick actions,
 *            then every component by category.
 *          - Typed, it groups the hits (Components, Categories, Quick actions), says how many there are, or says so
 *            when nothing matches.
 *          - The arrows move the active row without moving focus; Enter opens a page (remembered as recent) or runs
 *            an action.
 *          - It reports its own close.
 * Boundary: a memory router in jsdom with a stubbed `<dialog>` (jsdom has no showModal) and a cleared localStorage;
 *           the real registry; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-422:FR-001
import "#src/__tests__/stub-browser-apis";

import { CATEGORIES, COMPONENTS } from "@stackra/showcase";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { CommandPalette, type PaletteAction } from "#src/components/command-palette";

// jsdom has no modal dialog: opening and closing only flip `open`.
function showModal(this: HTMLDialogElement) {
  this.open = true;
}

function close(this: HTMLDialogElement) {
  this.open = false;
}

function renderPalette(onClose = vi.fn()) {
  const dark = vi.fn();
  const actions: PaletteAction[] = [
    { id: "dark", label: "Dark scheme", detail: "Colour scheme", icon: "moon", run: dark },
  ];
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <CommandPalette
            locale="en"
            actions={actions}
            search="?scheme=dark"
            isOpen
            onClose={onClose}
          />
        ),
      },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
  return { router, onClose, dark };
}

const input = () => screen.getByRole("combobox", { name: "Search components" });
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const press = (key: string) => fireEvent.keyDown(input(), { key });
const labels = () =>
  screen.getAllByRole("option").map((option) => option.querySelector(".font-medium")?.textContent);

describe("CommandPalette", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
    localStorage.clear();
  });

  it("opens as a dialog: the actions, then every component by category", () => {
    renderPalette();
    const dialog = screen.getByRole("dialog", { name: "Search components" }) as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(input().getAttribute("aria-controls")).toBe(screen.getByRole("listbox").id);
    expect(screen.getByRole("group", { name: "Quick actions" })).toBeTruthy();
    // A category with no component yet has no group: an empty heading helps no one.
    const filled = CATEGORIES.filter(({ id }) => COMPONENTS.some((entry) => entry.category === id));
    expect(screen.getAllByRole("group")).toHaveLength(1 + filled.length);
    expect(
      within(screen.getByRole("group", { name: "Actions" })).getAllByRole("option").length,
    ).toBe(COMPONENTS.filter((entry) => entry.category === "actions").length);
    expect(labels()[0]).toBe("Dark scheme");
    expect(screen.getByRole("status").textContent).toBe(`${1 + COMPONENTS.length} results`);
  });

  it("groups the hits: a title hit under Components, a category under Categories, an action last", () => {
    renderPalette();
    type("button");
    const components = within(screen.getByRole("group", { name: "Components" }));
    expect(components.getAllByRole("option")[0]?.textContent).toContain("Button");
    expect(components.getAllByRole("option")[0]?.textContent).toContain("Actions · Title");
    type("actions");
    expect(
      within(screen.getByRole("group", { name: "Categories" })).getByRole("option", {
        name: /Actions/,
      }),
    ).toBeTruthy();
    // Both words: "dark" alone also finds QR code, whose description says "dark on light" (a description hit, by design).
    type("dark scheme");
    expect(labels()).toEqual(["Dark scheme"]);
    expect(screen.getByRole("status").textContent).toBe("1 result");
  });

  it("says so when nothing matches", () => {
    renderPalette();
    type("zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No components match “zzz”.")).toBeTruthy();
    // The live status says it too, so a screen reader hears the empty result (STA-433).
    expect(screen.getByRole("status").textContent).toBe("No results");
    // No empty listbox: the field says the list is closed and points at nothing.
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(input().getAttribute("aria-controls")).toBeNull();
  });

  it("moves the active row with the arrows while focus stays in the field", () => {
    renderPalette();
    const options = screen.getAllByRole("option");
    expect(input().getAttribute("aria-activedescendant")).toBe(options[0]?.id);
    press("ArrowDown");
    expect(input().getAttribute("aria-activedescendant")).toBe(options[1]?.id);
    expect(options[1]?.getAttribute("aria-selected")).toBe("true");
    press("ArrowUp");
    press("ArrowUp");
    expect(input().getAttribute("aria-activedescendant")).toBe(options.at(-1)?.id);
    expect(document.activeElement).toBe(input());
  });

  it("opens the active page on Enter, keeping the search params, and remembers it", async () => {
    const { router, onClose } = renderPalette();
    type("checkbox");
    await act(async () => press("Enter"));
    expect(router.state.location.pathname).toBe("/checkbox");
    expect(router.state.location.search).toBe("?scheme=dark");
    expect(onClose).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("stackra-playground:recent") ?? "[]")).toEqual([
      "/checkbox",
    ]);
  });

  it("runs an action on Enter", () => {
    const { dark } = renderPalette();
    // Enter runs the top row; "dark" alone puts QR code (a description hit) above the action.
    type("dark scheme");
    press("Enter");
    expect(dark).toHaveBeenCalledTimes(1);
  });

  it("lists recent pages first, as rows of their own", () => {
    localStorage.setItem("stackra-playground:recent", JSON.stringify(["/checkbox", "/gone"]));
    renderPalette();
    expect(
      within(screen.getByRole("group", { name: "Recent" })).getAllByRole("option"),
    ).toHaveLength(1);
    const ids = screen.getAllByRole("option").map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("narrows the index to one platform", () => {
    renderPalette();
    const webOnly = COMPONENTS.filter((entry) => entry.platforms.includes("react")).length;
    act(() => screen.getByRole("radio", { name: "Native" }).click());
    expect(screen.getByRole("status").textContent).toBe(
      `${1 + COMPONENTS.length - (COMPONENTS.length - COMPONENTS.filter((entry) => entry.platforms.includes("native")).length)} results`,
    );
    act(() => screen.getByRole("radio", { name: "Web" }).click());
    expect(screen.getByRole("status").textContent).toBe(`${1 + webOnly} results`);
  });

  it("reports its close (Escape or the scrim) to the caller", () => {
    const { onClose } = renderPalette();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent(dialog, new Event("close"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
