/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useRunShortcut()`: the palette's runner runs the shortcut of the item it is given,
 *          awaiting an async `run`, with the contributed context; it throws outside a provider.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; the item comes from `useShortcuts`, as in the
 *           template's `usePalette`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 23); ADR 0245.
 */
// @vitest-environment jsdom
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { Shortcut } from "#core/bases/shortcut.base";
import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import { contributeShortcutContext } from "#core/functions/contribute-shortcut-context.function";
import { registerShortcuts } from "#core/functions/register-shortcuts.function";
import type { ShortcutContext } from "#core/types/shortcut-context.type";
import { useRunShortcut } from "#react/run-shortcut/use-run-shortcut";
import type { ShortcutItem } from "#react/shortcuts/shortcut-item.type";
import { useShortcuts } from "#react/shortcuts/use-shortcuts";

/** Finishes on a later tick and records its context. */
class SlowShortcut extends Shortcut({ group: "console::palette.group_app" }) {
  readonly runs: ShortcutContext[] = [];

  async run(ctx: ShortcutContext): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    this.runs.push(ctx);
  }
}

afterEach(() => {
  SHORTCUT_CONTEXT_PARTS.clear();
  SHORTCUT_ENTRIES.clear();
});

describe("useRunShortcut", () => {
  it("runs the shortcut of a palette item and awaits it", async () => {
    registerShortcuts([[SlowShortcut, "console.slow", "shortcuts::slow.label"]]);
    contributeShortcutContext(() => ({ source: "palette" }) as never);
    const shortcut = new SlowShortcut();
    const container = await Container.create([], {
      overrides: new Map<Token, object>([[SlowShortcut, shortcut]]),
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ContainerProvider container={container}>{children}</ContainerProvider>
    );
    const { result } = renderHook(() => ({ items: useShortcuts(), run: useRunShortcut() }), {
      wrapper,
    });
    const [item] = result.current.items;
    await act(() => result.current.run(item as ShortcutItem));
    expect(shortcut.runs).toEqual([{ source: "palette" }]);
    expectTypeOf(useRunShortcut).returns.toEqualTypeOf<(shortcut: ShortcutItem) => Promise<void>>();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderHook(() => useRunShortcut())).toThrow(/ContainerProvider/);
  });
});
