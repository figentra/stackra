/**
 * Stackra file contract:
 * Purpose: proves the Sidebar's Mod+B runs on the shortcut registry (ADR 0508): one press toggles it once, it is
 *          listed with its words, it does not fire while typing, and a remap moves it.
 * Boundary: jsdom with real HeroUI, React Aria and a ShortcutProvider.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { DEFAULT_SHORTCUT_SETTINGS } from "@stackra/shortcuts";
import { ShortcutProvider, useShortcutRegistry } from "@stackra/shortcuts/react";
import { act, render } from "@testing-library/react";

import { Sidebar } from "#react/sidebar/sidebar";

const press = (code: string, target: EventTarget = window) =>
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        code,
        key: code.slice(-1).toLowerCase(),
        ctrlKey: true,
        bubbles: true,
      }),
    );
  });

/** Lists the registered labels. */
function Labels() {
  return (
    <output>
      {useShortcutRegistry()
        .actions.map((one) => one.label)
        .join("|")}
    </output>
  );
}

describe("Sidebar shortcut", () => {
  it("toggles once per Mod+B, is listed, skips text fields and follows a remap", () => {
    const onCollapsedChange = vi.fn();
    const view = render(
      <ShortcutProvider>
        <Sidebar
          items={[{ id: "home", label: "Home", href: "/" }]}
          onCollapsedChange={onCollapsedChange}
        />
        <input aria-label="note" />
        <Labels />
      </ShortcutProvider>,
    );
    press("KeyB");
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(document.querySelector("output")?.textContent).toContain("Expand sidebar");
    const note = view.getByRole("textbox", { name: "note" });
    act(() => note.focus());
    press("KeyB", note);
    act(() => note.blur());
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    view.rerender(
      <ShortcutProvider
        settings={{ ...DEFAULT_SHORTCUT_SETTINGS, remaps: { "sidebar.toggle": "mod+j" } }}
      >
        <Sidebar
          items={[{ id: "home", label: "Home", href: "/" }]}
          onCollapsedChange={onCollapsedChange}
        />
      </ShortcutProvider>,
    );
    press("KeyJ");
    expect(onCollapsedChange).toHaveBeenCalledTimes(2);
  });
});
