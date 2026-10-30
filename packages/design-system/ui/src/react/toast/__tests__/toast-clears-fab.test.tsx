/**
 * Stackra file contract:
 * Purpose: proves a bottom toast stack is lifted clear of a floating Fab: a floating Fab counts itself in
 *          `FLOATING_FABS` while mounted (an inline one does not, and an unmount or a second release takes it off once
 *          only), and the ToastProvider adds the phone-width lift to a bottom region only while one is counted, keeping
 *          the caller's class, string or function.
 * Boundary: jsdom with real HeroUI; the lift is a `max-md:` class, so the media query itself is checked in the
 *           playground's screenshots.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (FAB toast).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { Fab } from "#react/fab/fab";
import { FLOATING_FABS } from "#core/constants/floating-fabs.constant";
import { toast } from "#react/toast/toast";
import { ToastProvider } from "#react/toast/toast-provider";

/** Watches nothing: jsdom has no layout, and the toast stack only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

/** The toast region, drawn in a portal. */
const region = () => document.querySelector<HTMLElement>('[data-slot="toast-region"]');

/** The lift's class prefix. */
const LIFT = "max-md:bottom-[calc(5.75rem";

describe("FLOATING_FABS", () => {
  it("counts a floating Fab while mounted, never an inline one", () => {
    const { rerender, unmount } = render(<Fab label="New order" />);
    expect(FLOATING_FABS.count()).toBe(1);
    rerender(<Fab label="New order" placement="inline" />);
    expect(FLOATING_FABS.count()).toBe(0);
    rerender(<Fab label="New order" placement="bottom-start" />);
    expect(FLOATING_FABS.count()).toBe(1);
    unmount();
    expect(FLOATING_FABS.count()).toBe(0);
  });

  it("releases one registration once only", () => {
    const release = FLOATING_FABS.register();
    expect(FLOATING_FABS.count()).toBe(1);
    release();
    release();
    expect(FLOATING_FABS.count()).toBe(0);
  });
});

describe("ToastProvider beside a floating Fab", () => {
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

  it("lifts a bottom stack only while a floating Fab is on screen, keeping the caller's class", () => {
    const { rerender } = render(<ToastProvider dismissLabel="Dismiss" className="app-toasts" />);
    act(() => void toast("Saved"));
    expect(region()?.className).toContain("app-toasts");
    expect(region()?.className).not.toContain(LIFT);
    rerender(
      <>
        <ToastProvider dismissLabel="Dismiss" className="app-toasts" />
        <Fab label="New order" />
      </>,
    );
    expect(region()?.className).toContain(LIFT);
    expect(region()?.className).toContain("app-toasts");
    rerender(<ToastProvider dismissLabel="Dismiss" className={() => "from-state"} />);
    expect(region()?.className).not.toContain(LIFT);
    expect(region()?.className).toContain("from-state");
  });

  it("leaves a top stack where it is", () => {
    render(
      <>
        <ToastProvider dismissLabel="Dismiss" position="top" />
        <Fab label="New order" />
      </>,
    );
    act(() => void toast("Saved"));
    expect(region()?.className).not.toContain(LIFT);
  });

  it("composes a function class with the lift", () => {
    render(
      <>
        <ToastProvider dismissLabel="Dismiss" className={() => "from-state"} />
        <Fab label="New order" />
      </>,
    );
    act(() => void toast("Saved"));
    expect(region()?.className).toContain(LIFT);
    expect(region()?.className).toContain("from-state");
  });
});
