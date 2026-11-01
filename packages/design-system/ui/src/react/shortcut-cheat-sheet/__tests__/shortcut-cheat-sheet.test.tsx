/**
 * Stackra file contract:
 * Purpose: proves the web ShortcutCheatSheet: `?` opens it from the page, it lists the registered actions grouped by
 *          scope with their spoken keys, and the search filters by words and keys.
 * Boundary: jsdom with real HeroUI, React Aria and a ShortcutProvider.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { Button } from "#react/button/button";
import { ShortcutCheatSheet } from "#react/shortcut-cheat-sheet/shortcut-cheat-sheet";

describe("ShortcutCheatSheet", () => {
  it("opens on ?, lists every registered action and filters", () => {
    render(
      <ShortcutProvider>
        <Button shortcut="mod+s" onPress={vi.fn()}>
          Save
        </Button>
        <Button shortcut="g o" shortcutId="go.orders" onPress={vi.fn()}>
          Orders
        </Button>
        <ShortcutCheatSheet />
      </ShortcutProvider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { code: "Slash", key: "?", shiftKey: true }),
      );
    });
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Keyboard shortcuts");
    expect(screen.getByRole("region", { name: "This page" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Everywhere" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "G, then O" })).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ctrl" } });
    expect(within(dialog).queryByText("Orders")).toBeNull();
    expect(within(dialog).getByText("Save")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    expect(screen.getByText("No shortcut matches")).toBeTruthy();
  });
});
