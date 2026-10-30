/**
 * Stackra file contract:
 * Purpose: proves the native `toast.promise` and `toast.undo`: the loading toast is persistent and drawn with a
 *          spinner, then shown again under the same id (HeroUI Native replaces it) in the success or danger tone for
 *          4000 ms; an undo toast carries a countdown and an action that runs `onUndo`, and `onCommit` runs only when
 *          it hides without an undo.
 * Boundary: React Native does not render in vitest, so heroui-native and the toast item are replaced by recording
 *           stand-ins and HeroUI Native's manager is a spy.
 * Runtime: node
 * Governing contract: ADR 0312; WCAG 2.2 SC 4.1.3 and 2.2.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import { toast } from "#native/toast/toast";
import { toastBridge } from "#native/toast/toast-bridge";
import { ToastProvider } from "#native/toast/toast-provider";

const heroui = vi.hoisted(() => ({
  manager: { show: vi.fn((_options: unknown) => "id"), hide: vi.fn((_ids?: unknown) => undefined) },
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    ToastProvider: (props: Record<string, unknown>) =>
      createElement("div", {}, props["children"] as ReactNode),
    useToast: () => ({ toast: heroui.manager, isToastVisible: false }),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", {}, props["children"] as ReactNode),
  };
});

vi.mock("#native/toast/toast-item", () => ({ ToastItem: () => null }));

// The provider lifts a bottom toast clear of a floating Fab by the safe area, which needs the native module.
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

/** The options of the manager's last `show`. */
const lastShown = (): Record<string, unknown> =>
  (heroui.manager.show.mock.lastCall?.[0] ?? {}) as Record<string, unknown>;

/** The props the last shown toast hands its ToastItem. */
const itemProps = (): Record<string, unknown> => {
  const component = lastShown()["component"] as (props: object) => ReactElement;
  const element = component({ id: "x" });
  expect(isValidElement(element)).toBe(true);
  return element.props as Record<string, unknown>;
};

/** A promise and its resolver, settled by the test. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let settle: ((value: T) => void) | undefined;
  const promise = new Promise<T>((done) => {
    settle = done;
  });
  return { promise, resolve: (value: T) => settle?.(value) };
}

describe("toast.promise and toast.undo (native)", () => {
  beforeEach(() => {
    toastBridge.disconnect();
    toastBridge.hide("all");
    heroui.manager.show.mockClear();
    render(<ToastProvider dismissLabel="Dismiss" />);
  });

  it("shows a persistent spinner toast, then the success under the same id", async () => {
    const { promise, resolve } = deferred<string>();
    const id = toast.promise(promise, {
      loading: "Saving",
      success: (name) => `${name} saved`,
      error: "Failed",
    });
    expect(lastShown()["id"]).toBe(id);
    expect(lastShown()["duration"]).toBe("persistent");
    expect(itemProps()).toMatchObject({ title: "Saving", isLoading: true });
    await act(async () => {
      resolve("Order 1042");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(lastShown()["id"]).toBe(id);
    expect(lastShown()["duration"]).toBe(4000);
    expect(itemProps()).toMatchObject({ title: "Order 1042 saved", tone: "success" });
    expect(itemProps()["isLoading"]).toBeUndefined();
  });

  it("shows a failure in the danger tone", async () => {
    toast.promise(() => Promise.reject(new Error("offline")), {
      loading: "Saving",
      success: "Saved",
      error: "Could not save",
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(itemProps()).toMatchObject({ title: "Could not save", tone: "danger" });
  });

  it("counts down, undoes on the action and commits only without an undo", () => {
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    toast.undo("Order deleted", { onUndo, onCommit, timeout: 5000 });
    expect(itemProps()["countdown"]).toBe(5000);
    expect(lastShown()["duration"]).toBe(5000);
    (itemProps()["action"] as { onPress: () => void }).onPress();
    (lastShown()["onHide"] as () => void)();
    expect(onUndo).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();

    toast.undo("Order archived", { onUndo, onCommit });
    (lastShown()["onHide"] as () => void)();
    expect(onCommit).toHaveBeenCalledOnce();
  });
});
