// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `ShortcutBindings`: a plain binding is registered as a hotkey and a chord as a sequence with
 *          the 1.5 s timeout, in the driver's spelling; palette-only and unbound shortcuts are skipped; a key press
 *          runs the bound instance with the contributed context; unmounting unregisters everything.
 * Boundary: test only; jsdom with Testing Library; TanStack Hotkeys is mocked at its two managers, so the test checks
 *           what is bound, not the driver's key matching.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269 (decision 4: vi.mock hoists); registry v3.1 R-66 and final review H.
 */
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";
import { render } from "@testing-library/react";

import { Shortcut } from "#core/bases/shortcut.base";
import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import { contributeShortcutContext } from "#core/functions/contribute-shortcut-context.function";
import { registerShortcuts } from "#core/functions/register-shortcuts.function";
import type { ShortcutContext } from "#core/types/shortcut-context.type";
import { ShortcutBindings } from "#react/shortcut-bindings/shortcut-bindings";

const driver = vi.hoisted(() => {
  const unregister = vi.fn();
  return {
    unregister,
    hotkey: vi.fn((..._args: unknown[]) => ({ unregister })),
    sequence: vi.fn((..._args: unknown[]) => ({ unregister })),
  };
});

vi.mock("@tanstack/hotkeys", () => ({
  getHotkeyManager: () => ({ register: driver.hotkey }),
  getSequenceManager: () => ({ register: driver.sequence }),
}));

/** Records the context of every run. */
class ToggleSidebarShortcut extends Shortcut({
  keys: "mod+b",
  group: "console::palette.group_app",
}) {
  readonly runs: ShortcutContext[] = [];

  run(ctx: ShortcutContext): void {
    this.runs.push(ctx);
  }
}

class GoToSettingsShortcut extends Shortcut({ keys: "g s", group: "console::palette.group_app" }) {
  run(): void {}
}

class SignOutShortcut extends Shortcut({ group: "console::palette.group_account" }) {
  run(): void {}
}

class LeftOutShortcut extends Shortcut({ keys: "mod+j", group: "console::palette.group_app" }) {
  run(): void {}
}

afterEach(() => {
  SHORTCUT_ENTRIES.clear();
  SHORTCUT_CONTEXT_PARTS.clear();
  vi.clearAllMocks();
});

describe("ShortcutBindings", () => {
  it("binds hotkeys and chords, runs on a press and unbinds on unmount", async () => {
    registerShortcuts([
      [ToggleSidebarShortcut, "console.toggle_sidebar", "shortcuts::toggle_sidebar.label"],
      [GoToSettingsShortcut, "console.go_to_settings", "shortcuts::go_to_settings.label"],
      [SignOutShortcut, "console.sign_out", "shortcuts::sign_out.label"],
      [LeftOutShortcut, "console.left_out", "shortcuts::left_out.label"],
    ]);
    contributeShortcutContext(() => ({ source: "keyboard" }) as never);
    const toggle = new ToggleSidebarShortcut();
    const container = await Container.create([], {
      overrides: new Map<Token, object>([
        [ToggleSidebarShortcut, toggle],
        [GoToSettingsShortcut, new GoToSettingsShortcut()],
        [SignOutShortcut, new SignOutShortcut()],
      ]),
    });
    const { unmount } = render(
      <ContainerProvider container={container}>
        <ShortcutBindings />
      </ContainerProvider>,
    );

    expect(driver.hotkey).toHaveBeenCalledTimes(1);
    expect(driver.hotkey.mock.calls[0]?.[0]).toBe("Mod+B");
    expect(driver.sequence).toHaveBeenCalledTimes(1);
    expect(driver.sequence.mock.calls[0]?.[0]).toEqual(["G", "S"]);
    expect(driver.sequence.mock.calls[0]?.[2]).toEqual({ timeout: 1500 });

    const press = driver.hotkey.mock.calls[0]?.[1] as () => void;
    press();
    await Promise.resolve();
    expect(toggle.runs).toEqual([{ source: "keyboard" }]);

    unmount();
    expect(driver.unregister).toHaveBeenCalledTimes(2);
  });

  it("renders nothing", async () => {
    const container = await Container.create([]);
    const { container: host } = render(
      <ContainerProvider container={container}>
        <ShortcutBindings />
      </ContainerProvider>,
    );
    expect(host.innerHTML).toBe("");
  });
});
