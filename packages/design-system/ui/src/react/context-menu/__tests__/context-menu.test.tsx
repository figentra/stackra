/**
 * Stackra file contract:
 * Purpose: proves the web ContextMenu: a right-click or the keyboard shortcut (the ContextMenu key, Shift+F10) on the
 *          area opens the menu, choosing an item reports its id and closes it, Escape closes it, and a disabled area
 *          keeps the browser's own menu.
 * Boundary: jsdom with real React Aria; jsdom has no layout, so the menu's position is not checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ContextMenu } from "#react/context-menu/context-menu";

const SECTIONS = [
  {
    id: "main",
    title: "Actions",
    items: [
      { id: "rename", label: "Rename" },
      { id: "delete", label: "Delete" },
    ],
  },
];

const area = () => screen.getByText("Row").parentElement as HTMLElement;

describe("ContextMenu (web)", () => {
  it("opens on right-click and reports the chosen item", () => {
    const onAction = vi.fn();
    render(
      <ContextMenu label="Row actions" sections={SECTIONS} onAction={onAction}>
        <span>Row</span>
      </ContextMenu>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    const event = fireEvent.contextMenu(area(), { clientX: 10, clientY: 20 });
    expect(event).toBe(false);
    expect(screen.getByRole("menu")).toBeTruthy();
    act(() => screen.getByRole("menuitem", { name: /Delete/ }).click());
    expect(onAction).toHaveBeenCalledWith("delete");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens from the ContextMenu key and Shift+F10, and closes on Escape", () => {
    render(
      <ContextMenu label="Row actions" sections={SECTIONS}>
        <span>Row</span>
      </ContextMenu>,
    );
    fireEvent.keyDown(area(), { key: "a" });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.keyDown(area(), { key: "ContextMenu" });
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.keyDown(area(), { key: "F10", shiftKey: true });
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("leaves the browser menu alone while disabled", () => {
    render(
      <ContextMenu label="Row actions" sections={SECTIONS} isDisabled>
        <span>Row</span>
      </ContextMenu>,
    );
    expect(fireEvent.contextMenu(area())).toBe(true);
    fireEvent.keyDown(area(), { key: "ContextMenu" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
