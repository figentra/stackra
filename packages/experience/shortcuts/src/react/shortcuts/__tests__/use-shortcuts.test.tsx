// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useShortcuts()`: the registered shortcuts the container binds, in order, as
 *          `ShortcutItem`s with absent optional fields left out; an unbound class is not listed; it throws outside a
 *          provider.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; instances given to the container as overrides, as
 *           the generated wiring's bindings would hand them out.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 23); ADR 0245.
 */
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { beforeEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { Shortcut } from "#core/bases/shortcut.base";
import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import { registerShortcuts } from "#core/functions/register-shortcuts.function";
import type { ShortcutItem } from "#react/shortcuts/shortcut-item.type";
import { useShortcuts } from "#react/shortcuts/use-shortcuts";

class OpenPaletteShortcut extends Shortcut({ keys: "mod+k", group: "console::palette.group_app" }) {
  run(): void {}
}

class SignOutShortcut extends Shortcut({
  group: "console::palette.group_account",
  icon: "log-out",
  intents: ["logout"],
}) {
  run(): void {}
}

class LeftOutShortcut extends Shortcut({ keys: "mod+j", group: "console::palette.group_app" }) {
  run(): void {}
}

beforeEach(() => {
  SHORTCUT_ENTRIES.clear();
  registerShortcuts([
    [OpenPaletteShortcut, "console.open_palette", "shortcuts::open_palette.label"],
    [SignOutShortcut, "console.sign_out", "shortcuts::sign_out.label"],
    [LeftOutShortcut, "console.left_out", "shortcuts::left_out.label"],
  ]);
});

describe("useShortcuts", () => {
  it("lists the bound shortcuts in registration order", async () => {
    const container = await Container.create([], {
      overrides: new Map<Token, object>([
        [OpenPaletteShortcut, new OpenPaletteShortcut()],
        [SignOutShortcut, new SignOutShortcut()],
      ]),
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ContainerProvider container={container}>{children}</ContainerProvider>
    );
    const { result } = renderHook(() => useShortcuts(), { wrapper });
    expect(result.current).toEqual([
      {
        type: OpenPaletteShortcut,
        key: "console.open_palette",
        label: "shortcuts::open_palette.label",
        group: "console::palette.group_app",
        keys: "mod+k",
      },
      {
        type: SignOutShortcut,
        key: "console.sign_out",
        label: "shortcuts::sign_out.label",
        group: "console::palette.group_account",
        icon: "log-out",
        intents: ["logout"],
      },
    ]);
    expectTypeOf(useShortcuts).returns.toEqualTypeOf<readonly ShortcutItem[]>();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderHook(() => useShortcuts())).toThrow(/ContainerProvider/);
  });
});
