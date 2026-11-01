/**
 * Stackra file contract:
 * Purpose: unit tests of the provider and hooks: `useShortcutAction` registers while mounted and its key runs the
 *          latest handler, the hint carries the platform display and `aria-keyshortcuts`, an overlay scope pauses the
 *          page, `useShortcutRegistry` lists actions, finds conflicts (standard, reserved) and saves settings; and
 *          without a provider nothing binds but the hint still draws.
 * Boundary: test only; jsdom with Testing Library.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { useShortcutAction } from "#react/shortcut-action/use-shortcut-action";
import { ShortcutOverlayScope } from "#react/shortcut-overlay-scope/shortcut-overlay-scope";
import { ShortcutProvider } from "#react/shortcut-provider/shortcut-provider";
import { useShortcutRegistry } from "#react/shortcut-registry/use-shortcut-registry";

function Save({ run }: { readonly run: () => void }) {
  const hint = useShortcutAction({ id: "doc.save", label: "Save", shortcut: "mod+s", run });
  return (
    <button type="button" aria-keyshortcuts={hint.ariaKeyShortcuts}>
      {hint.display?.steps.join(" ")}
    </button>
  );
}

describe("ShortcutProvider and useShortcutAction", () => {
  it("binds while mounted, draws the hint, and pauses under an overlay", () => {
    const run = vi.fn();
    const view = render(
      <ShortcutProvider>
        <Save run={run} />
      </ShortcutProvider>,
    );
    const button = view.getByRole("button");
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Control+S");
    expect(button.textContent).toBe("Ctrl+S");
    fireEvent.keyDown(window, { code: "KeyS", key: "s", ctrlKey: true });
    expect(run).toHaveBeenCalledTimes(1);
    view.rerender(
      <ShortcutProvider>
        <Save run={run} />
        <ShortcutOverlayScope />
      </ShortcutProvider>,
    );
    fireEvent.keyDown(window, { code: "KeyS", key: "s", ctrlKey: true });
    expect(run).toHaveBeenCalledTimes(1);
    view.unmount();
    fireEvent.keyDown(window, { code: "KeyS", key: "s", ctrlKey: true });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("draws the hint but binds nothing without a provider", () => {
    const run = vi.fn();
    const view = render(<Save run={run} />);
    expect(view.getByRole("button").textContent).toBe("Ctrl+S");
    fireEvent.keyDown(window, { code: "KeyS", key: "s", ctrlKey: true });
    expect(run).not.toHaveBeenCalled();
  });

  it("lists actions, checks conflicts and saves settings through the callback", () => {
    const onSettingsChange = vi.fn();
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <ShortcutProvider onSettingsChange={onSettingsChange}>
        <Save run={vi.fn()} />
        {children}
      </ShortcutProvider>
    );
    const { result } = renderHook(() => useShortcutRegistry(), { wrapper });
    expect(result.current.actions.map((one) => one.id)).toEqual(["doc.save"]);
    expect(result.current.conflictsOf("new.one", "mod+s")[0]?.shortcuts).toEqual([
      "new.one",
      "doc.save",
    ]);
    expect(result.current.conflictsOf("new.one", "mod+j")[0]?.shortcuts).toEqual([
      "new.one",
      "ai.ask",
    ]);
    expect(result.current.conflictsOf("new.one", "mod+w")[0]?.kind).toBe("reserved");
    expect(result.current.conflictsOf("new.one", "mod+shift+9")).toEqual([]);
    act(() => result.current.setSettings({ ...result.current.settings, hintMode: "hidden" }));
    expect(result.current.settings.hintMode).toBe("hidden");
    expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ hintMode: "hidden" }));
    expect(result.current.run("doc.save")).toBe(true);
  });
});
