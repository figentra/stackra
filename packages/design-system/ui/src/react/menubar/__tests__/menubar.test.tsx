/**
 * Stackra file contract:
 * Purpose: proves the web Menubar draws a named `menubar` of `menuitem`s with one tab stop, moves between them with
 *          Left, Right, Home and End (mirrored in right-to-left), opens a menu named by its item, switches to the
 *          neighbouring menu with Right inside an open menu, runs actions and keeps checkable actions in one list.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: WAI-ARIA menubar pattern; ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { MenubarMenu } from "#contracts/types/menubar-menu.type";
import { Menubar } from "#react/menubar/menubar";

const MENUS: readonly MenubarMenu[] = [
  {
    id: "file",
    label: "File",
    sections: [
      {
        id: "new",
        title: "New",
        isTitleHidden: true,
        items: [
          { id: "new-order", label: "New order", shortcut: "Ctrl+N" },
          { id: "export", label: "Export" },
        ],
      },
    ],
  },
  {
    id: "view",
    label: "View",
    selectionMode: "multiple",
    sections: [
      {
        id: "show",
        title: "Show",
        items: [
          { id: "grid", label: "Grid lines" },
          { id: "totals", label: "Totals row" },
        ],
      },
    ],
  },
  {
    id: "help",
    label: "Help",
    sections: [
      { id: "h", title: "Help", isTitleHidden: true, items: [{ id: "docs", label: "Docs" }] },
    ],
  },
];

const item = (name: string) => screen.getByRole("menuitem", { name, hidden: true });
const key = (element: Element, value: string) =>
  act(() => void fireEvent.keyDown(element, { key: value }));

describe("Menubar (web)", () => {
  it("is a named menubar with one tab stop", () => {
    render(<Menubar menus={MENUS} />);
    expect(screen.getByRole("menubar", { name: "Application menu" })).toBeTruthy();
    expect(item("File").tabIndex).toBe(0);
    expect(item("View").tabIndex).toBe(-1);
  });

  it("moves between menus with Right, Left, Home and End", () => {
    render(<Menubar menus={MENUS} />);
    act(() => item("File").focus());
    key(item("File"), "ArrowRight");
    expect(document.activeElement).toBe(item("View"));
    expect(item("View").tabIndex).toBe(0);
    key(item("View"), "End");
    expect(document.activeElement).toBe(item("Help"));
    key(item("Help"), "ArrowRight");
    expect(document.activeElement).toBe(item("File"));
    key(item("File"), "ArrowLeft");
    expect(document.activeElement).toBe(item("Help"));
  });

  it("mirrors Left and Right in right-to-left", () => {
    render(
      <I18nProvider locale="ar-SA">
        <Menubar menus={MENUS} />
      </I18nProvider>,
    );
    act(() => screen.getAllByRole("menuitem")[0]?.focus());
    key(item("File"), "ArrowLeft");
    expect(document.activeElement).toBe(item("View"));
  });

  it("opens a menu named by its item and switches to the next menu with Right", async () => {
    render(<Menubar menus={MENUS} />);
    act(() => item("File").click());
    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("aria-labelledby")).toBe(item("File").id);
    key(screen.getByRole("menuitem", { name: /New order/ }), "ArrowRight");
    await vi.waitFor(() =>
      expect(screen.getByRole("menuitemcheckbox", { name: "Grid lines" })).toBeTruthy(),
    );
    expect(item("View").getAttribute("aria-expanded")).toBe("true");
  });

  it("runs an action", () => {
    const onAction = vi.fn();
    render(<Menubar menus={MENUS} onAction={onAction} />);
    act(() => item("File").click());
    act(() => item("Export").click());
    expect(onAction).toHaveBeenLastCalledWith("export");
  });

  it("keeps the checked actions in one list", () => {
    const onChange = vi.fn();
    render(<Menubar menus={MENUS} defaultValue={["totals"]} onChange={onChange} />);
    act(() => item("View").click());
    act(() => screen.getByRole("menuitemcheckbox", { name: "Grid lines" }).click());
    expect(onChange).toHaveBeenLastCalledWith(["totals", "grid"]);
  });
});
