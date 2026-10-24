/**
 * Stackra file contract:
 * Purpose: proves the web `toast()` and `ToastProvider`: a toast appears in the region with its message, tone,
 *          description and icon; warning and danger are announced as alerts and the rest as polite statuses; the
 *          action runs once and closes the toast; the dismiss button is named by `dismissLabel` and is 24 px and
 *          visible; a timeout of 0 keeps the toast and the default removes it; `position` sets the edge; a toast
 *          shown before the provider mounts appears when it does; and the types refuse HeroUI's names.
 * Boundary: jsdom with real HeroUI and React Aria, fake timers for the timeouts, and stand-ins for `matchMedia` and
 *           `ResizeObserver`, which jsdom lacks and the toast stack reads; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 2.5.8, 4.1.3 and 2.2.1; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-112 sta-350:FR-113
import { act, render, screen } from "@testing-library/react";

import { Tone } from "#contracts/enums/tone.enum";
import type {
  ToastContractProps,
  ToastProviderContractProps,
} from "#contracts/types/toast-contract-props.type";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { toast } from "#react/toast/toast";
import { ToastProvider, type ToastProviderProps } from "#react/toast/toast-provider";

/** Watches nothing: jsdom has no layout, and the toast stack only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

/** The first toast element, read from the document: the region is a portal outside the render container. */
const toastElement = () => document.querySelector<HTMLElement>('[data-slot="toast"]');

/** The toast indicator and the toast region, read from the document: both are drawn in a portal. */
const indicator = () => document.querySelector('[data-slot="toast-indicator"]');
const region = () => document.querySelector('[data-slot="toast-region"]');

describe("toast (web)", () => {
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

  it("shows the message in a toast region and returns an id", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    let id = "";
    act(() => {
      id = toast("Order saved");
    });
    expect(id).toBeTruthy();
    expect(screen.getByText("Order saved")).toBeTruthy();
    expect(region()?.getAttribute("role")).toBe("region");
    expect(region()?.contains(toastElement())).toBe(true);
  });

  it("shows the description under the message", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Order saved", { description: "It ships on Monday." });
    });
    const content = document.querySelector('[data-slot="toast-content"]');
    expect([...(content?.children ?? [])].map((child) => child.getAttribute("data-slot"))).toEqual([
      "toast-title",
      "toast-description",
    ]);
    expect(screen.getByText("It ships on Monday.")).toBeTruthy();
  });

  it.each(Tone)("announces a %s toast by its tone", (tone) => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Something happened", { tone });
    });
    const content = document.querySelector('[data-slot="toast-content"]');
    const { role } = FEEDBACK_BY_TONE[tone];
    expect(content?.getAttribute("role")).toBe(role);
    expect(content?.getAttribute("aria-live")).toBe(role === "alert" ? "assertive" : "polite");
    expect(content?.getAttribute("aria-atomic")).toBe("true");
    expect(toastElement()?.classList.contains(`toast--${tone}`)).toBe(true);
  });

  it("has a shortcut for each tone, and info is accent", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast.success("a");
      toast.warning("b");
      toast.danger("c");
      toast.info("d");
    });
    const classes = [...document.querySelectorAll('[data-slot="toast"]')].map((element) =>
      ["success", "warning", "danger", "accent"].find((tone) =>
        element.classList.contains(`toast--${tone}`),
      ),
    );
    expect(classes.sort()).toEqual(["accent", "danger", "success", "warning"]);
  });

  it("draws the tone's icon, a named icon, an element as given, or none", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Failed", { tone: "danger" });
    });
    expect(indicator()?.querySelector("svg.lucide-circle-alert")).toBeTruthy();
    expect(indicator()?.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");

    act(() => toast.clear());
    act(() => vi.runOnlyPendingTimers());
    act(() => {
      toast("Failed", { icon: "info" });
    });
    expect(indicator()?.querySelector("svg.lucide-info")).toBeTruthy();

    act(() => toast.clear());
    act(() => vi.runOnlyPendingTimers());
    act(() => {
      toast("Failed", { icon: <i data-testid="mine" /> });
    });
    expect(screen.getByTestId("mine")).toBeTruthy();

    act(() => toast.clear());
    act(() => vi.runOnlyPendingTimers());
    act(() => {
      toast("Failed", { icon: false });
    });
    expect(indicator()).toBeNull();
  });

  it("runs the action once and closes the toast", () => {
    const onPress = vi.fn();
    const onClose = vi.fn();
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Order deleted", { action: { label: "Undo", onPress }, onClose });
    });
    act(() => screen.getByRole("button", { name: "Undo" }).click());
    expect(onPress).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText("Order deleted")).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("names the dismiss button by dismissLabel, draws it 24 px and visible, and closes on press", () => {
    const onClose = vi.fn();
    render(<ToastProvider dismissLabel="إغلاق الإشعار" />);
    act(() => {
      toast("Saved", { onClose });
    });
    const dismiss = screen.getByRole("button", { name: "إغلاق الإشعار" });
    expect(dismiss.classList.contains("size-6")).toBe(true);
    expect(dismiss.className).toContain("in-data-[frontmost=true]:opacity-100");
    act(() => dismiss.click());
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText("Saved")).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("removes a toast after the default timeout and keeps one with a timeout of 0", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Fleeting");
      toast("Staying", { timeout: 0 });
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Fleeting")).toBeNull();
    expect(screen.getByText("Staying")).toBeTruthy();
  });

  it("keeps a toast with an action longer by default, and honours the caller's own timeout", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Deleted", { action: { label: "Undo", onPress: vi.fn() } });
      toast("Quick", { timeout: 1000, action: { label: "Redo", onPress: vi.fn() } });
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Quick")).toBeNull();
    expect(screen.getByText("Deleted")).toBeTruthy();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Deleted")).toBeNull();
  });

  it("closes one toast by id and every toast with clear", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    let first = "";
    act(() => {
      first = toast("First", { timeout: 0 });
      toast("Second", { timeout: 0 });
    });
    act(() => toast.close(first));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText("First")).toBeNull();
    expect(screen.getByText("Second")).toBeTruthy();
    act(() => toast.clear());
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText("Second")).toBeNull();
  });

  it("sits at the bottom by default and at the top when asked", () => {
    const { rerender } = render(<ToastProvider dismissLabel="Dismiss notification" />);
    act(() => {
      toast("Saved", { timeout: 0 });
    });
    expect(region()?.classList.contains("toast-region--bottom")).toBe(true);
    rerender(<ToastProvider dismissLabel="Dismiss notification" position="top" />);
    expect(region()?.classList.contains("toast-region--top")).toBe(true);
  });

  it("shows a toast that was called before the provider mounted", () => {
    act(() => {
      toast("Early", { timeout: 0 });
    });
    render(<ToastProvider dismissLabel="Dismiss notification" />);
    expect(screen.getByText("Early")).toBeTruthy();
  });

  it("passes unknown region props through", () => {
    render(<ToastProvider dismissLabel="Dismiss notification" aria-label="الإشعارات" />);
    act(() => {
      toast("Saved", { timeout: 0 });
    });
    expect(document.querySelector('[data-slot="toast-region"]')?.getAttribute("aria-label")).toBe(
      "الإشعارات",
    );
  });

  it("types: extends the contracts, requires dismissLabel, refuses HeroUI's names", () => {
    expectTypeOf<ToastProviderProps>().toExtend<ToastProviderContractProps>();
    expectTypeOf<Parameters<typeof toast>[1]>().toEqualTypeOf<ToastContractProps | undefined>();
    // @ts-expect-error the dismiss button's name is the app's language, so it is required
    void (<ToastProvider />);
    // @ts-expect-error HeroUI's `placement` is the contract's `position`
    void (<ToastProvider dismissLabel="Dismiss" placement="top" />);
    // @ts-expect-error HeroUI's `variant` is the contract's `tone`
    toast("Saved", { variant: "danger" });
    // @ts-expect-error a toast has no `status`
    toast("Saved", { status: "danger" });
    // @ts-expect-error the shortcut sets the tone
    toast.success("Saved", { tone: "danger" });
  });
});
