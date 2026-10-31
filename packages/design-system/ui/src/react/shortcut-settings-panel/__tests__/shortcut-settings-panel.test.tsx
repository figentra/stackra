/**
 * Stackra file contract:
 * Purpose: proves the web ShortcutSettingsPanel: the hint-mode and single-key switches report new settings, the key
 *          recorder records a press, warns on a clash and refuses a reserved key, a saved remap is reported, and a
 *          tenant-locked field cannot be changed.
 * Boundary: jsdom with real HeroUI, React Aria and a ShortcutProvider; storage through `onChange`.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { DEFAULT_SHORTCUT_SETTINGS, type ShortcutSettings } from "@stackra/shortcuts";
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Button } from "#react/button/button";
import { ShortcutSettingsPanel } from "#react/shortcut-settings-panel/shortcut-settings-panel";

const setup = (value: ShortcutSettings = DEFAULT_SHORTCUT_SETTINGS) => {
  const onChange = vi.fn();
  render(
    <ShortcutProvider settings={value}>
      <Button shortcut="mod+s" shortcutId="doc.save" onPress={vi.fn()}>
        Store
      </Button>
      <Button shortcut="mod+e" shortcutId="doc.export" onPress={vi.fn()}>
        Export
      </Button>
      <ShortcutSettingsPanel value={value} onChange={onChange} />
    </ShortcutProvider>,
  );
  return onChange;
};

const record = (row: number, init: KeyboardEventInit) => {
  const change = screen.getAllByRole("button", { name: "Change" })[row];
  if (change === undefined) throw new Error("no Change button");
  act(() => change.click());
  fireEvent.keyDown(screen.getByRole("button", { name: "Press the new keys" }), init);
};

describe("ShortcutSettingsPanel", () => {
  it("reports the hint mode and single-key switches", () => {
    const onChange = setup();
    act(() => screen.getByRole("switch", { name: "Show keys beside actions" }).click());
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ hintMode: "hidden" }));
    act(() => screen.getByRole("switch", { name: "Single-key shortcuts" }).click());
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ singleKey: false }));
  });

  it("records a key, warns on a clash, refuses a reserved key and saves a remap", () => {
    const onChange = setup();
    record(0, { code: "KeyE", key: "e", ctrlKey: true });
    expect(screen.getByText("Already used by Export")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Cancel" }).click());
    record(0, { code: "KeyW", key: "w", ctrlKey: true });
    expect(screen.getByText("The browser or the system keeps these keys")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Save" }).hasAttribute("disabled") ||
        screen.getByRole("button", { name: "Save" }).getAttribute("aria-disabled") === "true",
    ).toBe(true);
    act(() => screen.getByRole("button", { name: "Cancel" }).click());
    record(0, { code: "KeyK", key: "k", ctrlKey: true, shiftKey: true });
    act(() => screen.getByRole("button", { name: "Save" }).click());
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ remaps: { "doc.save": "mod+shift+k" } }),
    );
  });

  it("locks what the tenant locked", () => {
    setup({ ...DEFAULT_SHORTCUT_SETTINGS, locked: ["hintMode", "remaps"] });
    const toggle = screen.getByRole("switch", { name: "Show keys beside actions" });
    expect(toggle.hasAttribute("disabled") || toggle.getAttribute("aria-disabled") === "true").toBe(
      true,
    );
    expect(screen.getAllByText("Set by your organisation").length).toBeGreaterThan(0);
  });
});
