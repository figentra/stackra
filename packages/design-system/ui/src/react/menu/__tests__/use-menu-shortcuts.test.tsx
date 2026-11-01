/**
 * Stackra file contract:
 * Purpose: proves a Menu's bound actions answer their keys while the menu is closed (onPress, then onAction), that a
 *          disabled action and an older display-only hint (`⌘R`) do not bind, and that the item draws its hint and the
 *          Menubar binds its menus' actions too.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, render, screen } from "@testing-library/react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import { Button } from "#react/button/button";
import { Menu } from "#react/menu/menu";
import { Menubar } from "#react/menubar/menubar";

const ctrl = (code: string, key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code, key, ctrlKey: true, bubbles: true }));
  });

const sections = (onPress: () => void): readonly MenuSection[] => [
  {
    id: "edit",
    title: "Edit",
    items: [
      { id: "rename", label: "Rename", shortcut: "mod+e", onPress },
      { id: "old", label: "Old", shortcut: "⌘R", onPress },
      { id: "off", label: "Off", shortcut: "mod+d", onPress, isDisabled: true },
    ],
  },
];

describe("menu shortcuts", () => {
  it("runs a bound action with the menu closed, and skips disabled and display-only hints", () => {
    const onPress = vi.fn();
    const onAction = vi.fn();
    render(
      <ShortcutProvider>
        <Menu sections={sections(onPress)} onAction={onAction}>
          <Button>Open</Button>
        </Menu>
      </ShortcutProvider>,
    );
    ctrl("KeyE", "e");
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("rename");
    ctrl("KeyD", "d");
    ctrl("KeyR", "r");
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => screen.getByRole("button", { name: "Open" }).click());
    expect(screen.getByText("Ctrl+E")).toBeTruthy();
    expect(screen.getByText("⌘R")).toBeTruthy();
  });

  it("binds the Menubar's actions", () => {
    const onAction = vi.fn();
    render(
      <ShortcutProvider>
        <Menubar
          aria-label="App"
          menus={[{ id: "file", label: "File", sections: sections(() => undefined) }]}
          onAction={onAction}
        />
      </ShortcutProvider>,
    );
    ctrl("KeyE", "e");
    expect(onAction).toHaveBeenCalledWith("rename");
  });
});
