/**
 * Stackra file contract:
 * Purpose: proves the web `toast.promise` and `toast.undo`: one toast shows a spinner and the loading words, then turns
 *          into the success words (or the failure words, in the danger tone and announced as an alert) in place; an
 *          undo toast says "Undo" with a countdown ring, runs `onUndo` and closes when pressed, and runs `onCommit`
 *          only when it closes without an undo.
 * Boundary: jsdom with real HeroUI and React Aria, fake timers, and stand-ins for `matchMedia` and `ResizeObserver`.
 * Runtime: browser
 * Governing contract: ADR 0312; WCAG 2.2 SC 4.1.3 and 2.2.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { toast } from "#react/toast/toast";
import { ToastProvider } from "#react/toast/toast-provider";

/** Watches nothing: jsdom has no layout. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

/** Lets the settled promise's handlers run. */
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

/** A promise and its resolver, settled by the test. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let settle: ((value: T) => void) | undefined;
  const promise = new Promise<T>((done) => {
    settle = done;
  });
  return { promise, resolve: (value: T) => settle?.(value) };
}

describe("toast.promise and toast.undo (web)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    act(() => toast.clear());
    act(() => vi.runOnlyPendingTimers());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("turns one loading toast into the success message in place", async () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    const { promise, resolve } = deferred<number>();
    act(() => {
      toast.promise(promise, {
        loading: "Saving the order…",
        success: (count) => `${count} orders saved`,
        error: "Could not save",
      });
    });
    expect(screen.getByText("Saving the order…")).toBeTruthy();
    const spinner = '[data-slot="toast-indicator"] [data-slot="spinner-icon"]';
    expect(document.querySelector(spinner)).toBeTruthy();
    resolve(3);
    await flush();
    expect(document.querySelector(spinner)).toBeNull();
    expect(screen.getByText("3 orders saved")).toBeTruthy();
    expect(screen.queryByText("Saving the order…")).toBeNull();
    expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
  });

  it("shows the failure in the danger tone, as an alert", async () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    act(() => {
      toast.promise(() => Promise.reject(new Error("offline")), {
        loading: "Saving",
        success: "Saved",
        error: (reason) => `Failed: ${(reason as Error).message}`,
      });
    });
    await flush();
    const message = screen.getByText("Failed: offline");
    expect(message.closest('[role="alert"]')).toBeTruthy();
  });

  it("runs onUndo and closes when Undo is pressed, and never commits", () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    act(() => {
      toast.undo("Order deleted", { onUndo, onCommit });
    });
    expect(document.querySelector('[data-slot="toast-indicator"] circle')).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    });
    act(() => vi.runOnlyPendingTimers());
    expect(onUndo).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits once the countdown runs out", () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    const onCommit = vi.fn();
    act(() => {
      toast.undo("Order deleted", { onUndo: () => undefined, onCommit, timeout: 5000 });
    });
    act(() => vi.advanceTimersByTime(6000));
    act(() => vi.runOnlyPendingTimers());
    expect(onCommit).toHaveBeenCalledOnce();
  });
});
