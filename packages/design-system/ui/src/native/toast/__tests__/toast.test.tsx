/**
 * Stackra file contract:
 * Purpose: proves the native `toast()` and `ToastProvider`: a call before any provider waits and is shown when one
 *          connects; a call after shows at once through the manager with a fresh id, a timeout of 0 as `persistent`
 *          and the close callback as `onHide`; the toast renders a ToastItem with the tone, message and the dismiss
 *          label the provider was given; `close` and `clear` hide (and drop what still waits); the provider hands
 *          HeroUI Native the position as `placement` and reconnects on every manager change; and the types refuse
 *          HeroUI's names.
 * Boundary: React Native does not render in vitest, so heroui-native and the toast item are replaced by recording
 *           stand-ins; HeroUI Native's manager is a spy, so what reaches it is checked, not how it draws.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-112 sta-350:FR-114
import { act, render } from "@testing-library/react";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import type {
  ToastContractProps,
  ToastProviderContractProps,
} from "#contracts/types/toast-contract-props.type";
import { toast } from "#native/toast/toast";
import { toastBridge } from "#native/toast/toast-bridge";
import { ToastProvider, type ToastProviderProps } from "#native/toast/toast-provider";

/** What the stand-ins recorded: the provider's props and the manager it offers. */
const heroui = vi.hoisted(() => ({
  providerProps: {} as Record<string, unknown>,
  manager: { show: vi.fn((_options: unknown) => "id"), hide: vi.fn((_ids?: unknown) => undefined) },
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    ToastProvider: (props: Record<string, unknown>) => {
      heroui.providerProps = props;
      return createElement("div", { "data-testid": "provider" }, props["children"] as ReactNode);
    },
    useToast: () => ({ toast: heroui.manager, isToastVisible: false }),
  };
});

vi.mock("#native/toast/toast-item", () => ({
  ToastItem: () => null,
}));

/** The options the manager's `show` was last called with. */
const lastShown = (): Record<string, unknown> =>
  (heroui.manager.show.mock.lastCall?.[0] ?? {}) as Record<string, unknown>;

/** Renders what the shown toast's `component` returns, as HeroUI Native would, and gives its element's props. */
const renderedProps = (): Record<string, unknown> => {
  const component = lastShown()["component"] as (props: object) => ReactElement;
  const element = component({ id: "x" });
  expect(isValidElement(element)).toBe(true);
  return element.props as Record<string, unknown>;
};

describe("toast (native)", () => {
  beforeEach(() => {
    toastBridge.disconnect();
    toastBridge.hide("all");
    heroui.manager.show.mockClear();
    heroui.manager.hide.mockClear();
    heroui.providerProps = {};
  });

  it("holds a toast called before a provider and shows it when one connects", () => {
    const id = toast("Early");
    expect(heroui.manager.show).not.toHaveBeenCalled();
    render(<ToastProvider dismissLabel="Dismiss" />);
    expect(heroui.manager.show).toHaveBeenCalledOnce();
    expect(lastShown()["id"]).toBe(id);
  });

  it("shows a toast at once through a connected provider, with a fresh id each time", () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    const first = toast("One");
    const second = toast("Two");
    expect(first).not.toBe(second);
    expect(heroui.manager.show).toHaveBeenCalledTimes(2);
    expect(lastShown()["id"]).toBe(second);
  });

  it("hands HeroUI Native the default duration, `persistent` for 0, and the close callback as onHide", () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    toast("Plain");
    expect(lastShown()).not.toHaveProperty("duration");
    expect(lastShown()).not.toHaveProperty("onHide");
    toast("Staying", { timeout: 0 });
    expect(lastShown()["duration"]).toBe("persistent");
    const onClose = vi.fn();
    toast("Timed", { timeout: 2500, onClose });
    expect(lastShown()["duration"]).toBe(2500);
    expect(lastShown()["onHide"]).toBe(onClose);
  });

  it("renders a toast item with the message, the options and the provider's dismiss label", () => {
    render(<ToastProvider dismissLabel="إغلاق الإشعار" />);
    const action = { label: "Undo", onPress: vi.fn() };
    toast("Order deleted", { tone: "warning", description: "One order", icon: false, action });
    expect(renderedProps()).toMatchObject({
      tone: "warning",
      title: "Order deleted",
      description: "One order",
      icon: false,
      action,
      dismissLabel: "إغلاق الإشعار",
    });
  });

  it("has a shortcut for each tone, and info is accent", () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    const tones = (["success", "warning", "danger", "info"] as const).map((name) => {
      toast[name]("Message");
      return renderedProps()["tone"];
    });
    expect(tones).toEqual(["success", "warning", "danger", "accent"]);
  });

  it("closes one toast by id and every toast with clear", () => {
    render(<ToastProvider dismissLabel="Dismiss" />);
    const id = toast("One");
    toast.close(id);
    expect(heroui.manager.hide).toHaveBeenLastCalledWith(id);
    toast.clear();
    expect(heroui.manager.hide).toHaveBeenLastCalledWith("all");
  });

  it("drops a toast that still waits when it is closed, and all of them on clear", () => {
    const first = toast("First");
    toast("Second");
    toast.close(first);
    render(<ToastProvider dismissLabel="Dismiss" />);
    expect(heroui.manager.show).toHaveBeenCalledOnce();
    expect(lastShown()["id"]).not.toBe(first);
    act(() => toastBridge.disconnect());
    toast("Third");
    toast.clear();
    render(<ToastProvider dismissLabel="Dismiss" />);
    expect(heroui.manager.show).toHaveBeenCalledOnce();
  });

  it("gives HeroUI Native the position as placement, the bottom by default", () => {
    const { rerender } = render(<ToastProvider dismissLabel="Dismiss" />);
    expect(heroui.providerProps["defaultProps"]).toEqual({ placement: "bottom" });
    rerender(<ToastProvider dismissLabel="Dismiss" position="top" />);
    expect(heroui.providerProps["defaultProps"]).toEqual({ placement: "top" });
  });

  it("passes unknown provider props and the children through", () => {
    const { getByTestId } = render(
      <ToastProvider dismissLabel="Dismiss" maxVisibleToasts={5}>
        <i data-testid="app" />
      </ToastProvider>,
    );
    expect(heroui.providerProps["maxVisibleToasts"]).toBe(5);
    expect(getByTestId("provider").contains(getByTestId("app"))).toBe(true);
  });

  it("stops showing through an unmounted provider, and holds toasts for the next", () => {
    const { unmount } = render(<ToastProvider dismissLabel="Dismiss" />);
    unmount();
    toast("After");
    expect(heroui.manager.show).not.toHaveBeenCalled();
    render(<ToastProvider dismissLabel="Dismiss" />);
    expect(heroui.manager.show).toHaveBeenCalledOnce();
  });

  it("types: extends the contracts, requires dismissLabel, refuses HeroUI's names", () => {
    expectTypeOf<ToastProviderProps>().toExtend<ToastProviderContractProps>();
    expectTypeOf<Parameters<typeof toast>[1]>().toEqualTypeOf<ToastContractProps | undefined>();
    // @ts-expect-error the dismiss button's name is the app's language, so it is required
    void (<ToastProvider />);
    // @ts-expect-error HeroUI Native's global config is the provider's own
    void (<ToastProvider dismissLabel="Dismiss" defaultProps={{ placement: "top" }} />);
    // @ts-expect-error HeroUI Native's `variant` is the contract's `tone`
    toast("Saved", { variant: "danger" });
    // @ts-expect-error HeroUI Native's `duration` is the contract's `timeout`
    toast("Saved", { duration: 100 });
    // @ts-expect-error the shortcut sets the tone
    toast.success("Saved", { tone: "danger" });
  });
});
