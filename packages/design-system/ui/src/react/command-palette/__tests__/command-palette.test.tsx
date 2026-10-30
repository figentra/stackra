/**
 * Stackra file contract:
 * Purpose: proves the web CommandPalette: the hotkey (meta or ctrl with the key) opens and closes it, it lists the
 *          sections and their commands with descriptions and shortcuts, typing filters them and shows the empty
 *          state, choosing a command closes the palette and reports its id; `isOpen` controls it and `hotkey={false}`
 *          turns the shortcut off.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and text are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { CommandSection } from "#contracts/types/command-section.type";
import { CommandPalette } from "#react/command-palette/command-palette";

const SECTIONS: readonly CommandSection[] = [
  {
    id: "nav",
    title: "Go to",
    items: [
      { id: "orders", label: "Orders", description: "All orders", icon: "check", shortcut: "G O" },
      { id: "customers", label: "Customers" },
    ],
  },
];

const hotkey = (key: string, init: KeyboardEventInit = { metaKey: true }) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });

describe("CommandPalette (web)", () => {
  it("opens with the hotkey and lists sections, descriptions and shortcuts", () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette sections={SECTIONS} onAction={vi.fn()} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    hotkey("x");
    expect(screen.queryByRole("dialog")).toBeNull();
    hotkey("K", { ctrlKey: true });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Go to")).toBeTruthy();
    expect(screen.getByText("All orders")).toBeTruthy();
    expect(screen.getByText("G O")).toBeTruthy();
    expect(screen.getByRole("searchbox").getAttribute("placeholder")).toBe("Search commands");
    hotkey("k");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("filters by the query, shows the empty state, and runs the chosen command", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        sections={SECTIONS}
        onAction={onAction}
        onOpenChange={onOpenChange}
        defaultOpen
        placeholder="Find"
      />,
    );
    const search = screen.getByRole("searchbox");
    expect(search.getAttribute("placeholder")).toBe("Find");
    fireEvent.change(search, { target: { value: "cust" } });
    expect(screen.queryByText("Orders")).toBeNull();
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("No commands match")).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    act(() => screen.getByRole("option", { name: /Customers/ }).click());
    expect(onAction).toHaveBeenCalledWith("customers");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is controlled by isOpen and ignores the shortcut when it is off", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <CommandPalette
        sections={SECTIONS}
        onAction={vi.fn()}
        hotkey={false}
        onOpenChange={onOpenChange}
      />,
    );
    hotkey("k");
    expect(onOpenChange).not.toHaveBeenCalled();
    rerender(
      <CommandPalette sections={SECTIONS} onAction={vi.fn()} isOpen onOpenChange={onOpenChange} />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
