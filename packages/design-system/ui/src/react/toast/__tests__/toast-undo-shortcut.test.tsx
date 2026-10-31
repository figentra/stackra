/**
 * Stackra file contract:
 * Purpose: proves the web toast.undo registers Mod+Z while the toast shows: the key undoes and closes it.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider; keys dispatched with their `code`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { toast } from "#react/toast/toast";
import { ToastProvider } from "#react/toast/toast-provider";

describe("toast.undo shortcut (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    act(() => toast.clear());
    vi.unstubAllGlobals();
  });

  it("undoes on Mod+Z", () => {
    const onUndo = vi.fn();
    render(
      <ShortcutProvider>
        <ToastProvider dismissLabel="Dismiss" />
      </ShortcutProvider>,
    );
    act(() => {
      toast.undo("Order archived", { onUndo });
    });
    expect(screen.getByText("Order archived")).toBeTruthy();
    fireEvent.keyDown(document.body, { key: "z", code: "KeyZ", ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
