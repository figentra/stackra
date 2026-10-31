/**
 * Stackra file contract:
 * Purpose: proves the shortcut-aware Button and IconButton (ADR 0508): the key runs `onPress`, the control carries
 *          `aria-keyshortcuts`, visible mode draws an inline Kbd, hidden mode draws none, an `action` gives the label,
 *          a disabled button's key does nothing, and holding Mod reveals a badge on an icon button.
 * Boundary: jsdom with real HeroUI, React Aria and a ShortcutProvider.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { DEFAULT_SHORTCUT_SETTINGS } from "@stackra/shortcuts";
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, render, screen } from "@testing-library/react";

import { Button } from "#react/button/button";
import { IconButton } from "#react/icon-button/icon-button";

const press = (code: string, init: KeyboardEventInit = { ctrlKey: true }) =>
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code,
        key: code.slice(-1).toLowerCase(),
        bubbles: true,
        ...init,
      }),
    );
  });

describe("Button shortcuts", () => {
  it("runs onPress from the key, names the keys and draws the inline hint", () => {
    const onPress = vi.fn();
    render(
      <ShortcutProvider>
        <Button shortcut="mod+s" onPress={onPress}>
          Save
        </Button>
      </ShortcutProvider>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Control+S");
    // A touch screen shows no hint until a hardware key is pressed.
    expect(button.querySelector("[data-slot='shortcut-hint']")).toBeNull();
    press("KeyS");
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button.querySelector("[data-slot='shortcut-hint']")?.textContent).toBe("Ctrl+S");
  });

  it("draws no inline hint in hidden mode, takes its words from an action, and ignores a disabled button", () => {
    const run = vi.fn();
    const onPress = vi.fn();
    render(
      <ShortcutProvider settings={{ ...DEFAULT_SHORTCUT_SETTINGS, hintMode: "hidden" }}>
        <Button action={{ id: "doc.publish", label: "Publish", shortcut: "mod+p", run }} />
        <Button shortcut="mod+d" onPress={onPress} isDisabled>
          Delete
        </Button>
      </ShortcutProvider>,
    );
    const publish = screen.getByRole("button", { name: "Publish" });
    expect(publish.querySelector("[data-slot='shortcut-hint']")).toBeNull();
    press("KeyP");
    expect(run).toHaveBeenCalledTimes(1);
    press("KeyD");
    expect(onPress).not.toHaveBeenCalled();
  });

  it("reveals a badge on an icon button while Mod is held", () => {
    vi.useFakeTimers();
    render(
      <ShortcutProvider>
        <IconButton icon="search" label="Search" shortcut="mod+f" onPress={vi.fn()} />
      </ShortcutProvider>,
    );
    const button = screen.getByRole("button", { name: "Search" });
    expect(button.querySelector("[data-slot='shortcut-hint']")).toBeNull();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Control", code: "ControlLeft", ctrlKey: true }),
      );
      vi.advanceTimersByTime(500);
    });
    expect(button.querySelector("[data-slot='shortcut-hint']")?.textContent).toBe("Ctrl+F");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Control", code: "ControlLeft" }));
    });
    expect(button.querySelector("[data-slot='shortcut-hint']")).toBeNull();
    vi.useRealTimers();
  });
});
