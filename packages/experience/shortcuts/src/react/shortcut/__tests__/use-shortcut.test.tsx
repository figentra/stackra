// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useShortcut(Class)`: the handler runs the instance the container binds with the
 *          contributed context, it is stable across renders, it rejects for an unbound class, and the hook throws
 *          outside a provider.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; the instance given to the container as an override.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 17 and 23).
 */
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { Shortcut } from "#core/bases/shortcut.base";
import { SHORTCUT_CONTEXT_PARTS } from "#core/constants/shortcut-context-parts.constant";
import { contributeShortcutContext } from "#core/functions/contribute-shortcut-context.function";
import type { ShortcutContext } from "#core/types/shortcut-context.type";
import { useShortcut } from "#react/shortcut/use-shortcut";

/** Records the context of every run. */
class RecordingShortcut extends Shortcut({ keys: "mod+b", group: "console::palette.group_app" }) {
  readonly runs: ShortcutContext[] = [];

  run(ctx: ShortcutContext): void {
    this.runs.push(ctx);
  }
}

class UnboundShortcut extends Shortcut({ group: "console::palette.group_app" }) {
  run(): void {}
}

afterEach(() => {
  SHORTCUT_CONTEXT_PARTS.clear();
});

/** A wrapper whose container binds `shortcut`. */
async function wrapperWith(shortcut: RecordingShortcut) {
  const container = await Container.create([], {
    overrides: new Map<Token, object>([[RecordingShortcut, shortcut]]),
  });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

describe("useShortcut", () => {
  it("runs the bound instance with the contributed context", async () => {
    const shortcut = new RecordingShortcut();
    contributeShortcutContext(() => ({ scheme: "dark" }) as never);
    const { result } = renderHook(() => useShortcut(RecordingShortcut), {
      wrapper: await wrapperWith(shortcut),
    });
    await act(() => result.current());
    expect(shortcut.runs).toEqual([{ scheme: "dark" }]);
    expectTypeOf(result.current).toEqualTypeOf<() => Promise<void>>();
  });

  it("returns the same handler across renders", async () => {
    const { result, rerender } = renderHook(() => useShortcut(RecordingShortcut), {
      wrapper: await wrapperWith(new RecordingShortcut()),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("rejects for a class the container does not bind", async () => {
    const { result } = renderHook(() => useShortcut(UnboundShortcut), {
      wrapper: await wrapperWith(new RecordingShortcut()),
    });
    await expect(result.current()).rejects.toThrow(/UnboundShortcut/);
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderHook(() => useShortcut(RecordingShortcut))).toThrow(/ContainerProvider/);
  });
});
