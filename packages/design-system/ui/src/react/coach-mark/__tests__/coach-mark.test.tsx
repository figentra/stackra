/**
 * Stackra file contract:
 * Purpose: proves the web CoachMark renders nothing closed; open, cuts out the first target and anchors a named
 *          callout with "Step n of m"; Next and Back walk the steps with the cutout following; Done finishes `done`;
 *          Skip and Escape finish `skipped`; and under reduced motion the cutout jumps and the beacon does not pulse.
 * Boundary: jsdom with real HeroUI and React Aria; jsdom has no layout, so `getBoundingClientRect` is stubbed by
 *           each target's text; `useUiText` echoes the key and its values; `useReducedMotion` is stubbed per test.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 39; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type * as Motion from "motion/react";
import { createRef } from "react";

import { CoachMark } from "#react/coach-mark/coach-mark";

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("motion/react", async (original) => ({
  ...(await original<typeof Motion>()),
  useReducedMotion: () => motionState.reduced,
}));

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

/** Where each target sits, by its text; jsdom lays nothing out. */
const PLACES: Record<string, DOMRect> = {
  Scan: DOMRect.fromRect({ x: 10, y: 20, width: 100, height: 40 }),
  Pay: DOMRect.fromRect({ x: 300, y: 400, width: 80, height: 40 }),
};

/** The two targets. */
const SCAN = createRef<HTMLButtonElement>();
const PAY = createRef<HTMLButtonElement>();

/** Two targets and the tour over them. */
function Tour(props: {
  isOpen?: boolean;
  onFinish?: (outcome: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <>
      <button type="button" ref={SCAN}>
        Scan
      </button>
      <button type="button" ref={PAY}>
        Pay
      </button>
      <CoachMark
        isOpen={props.isOpen ?? true}
        {...(props.onFinish ? { onFinish: props.onFinish } : {})}
        {...(props.onOpenChange ? { onOpenChange: props.onOpenChange } : {})}
        steps={[
          {
            id: "scan",
            target: SCAN,
            title: "Scan items",
            description: "Point the scanner at a barcode.",
          },
          { id: "pay", target: PAY, title: "Take payment" },
        ]}
      />
    </>
  );
}

const cutout = () => document.querySelector<HTMLElement>("[data-slot='coach-mark-cutout']");

describe("CoachMark (web)", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return PLACES[this.textContent ?? ""] ?? DOMRect.fromRect();
    });
  });
  afterEach(() => {
    motionState.reduced = false;
    vi.restoreAllMocks();
  });

  it("renders nothing while closed", () => {
    render(<Tour isOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cutout()).toBeNull();
  });

  it("cuts out the first target and anchors a named callout with the step count", () => {
    render(<Tour />);
    expect(screen.getByRole("dialog", { name: "Scan items" })).toBeTruthy();
    expect(screen.getByText("Point the scanner at a barcode.")).toBeTruthy();
    expect(screen.getByText(/progress \{"current":1,"total":2\}/)).toBeTruthy();
    expect(cutout()?.style.top).toBe("14px");
    expect(cutout()?.style.width).toBe("112px");
    expect(cutout()?.style.transition).toMatch(/top 250ms/);
    expect(screen.queryByRole("button", { name: /\.back$/ })).toBeNull();
  });

  it("walks forward and back, the cutout following, and finishes done", () => {
    const onFinish = vi.fn();
    const onOpenChange = vi.fn();
    render(<Tour onFinish={onFinish} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: /\.next$/ }));
    expect(screen.getByRole("dialog", { name: "Take payment" })).toBeTruthy();
    expect(cutout()?.style.left).toBe("294px");
    fireEvent.click(screen.getByRole("button", { name: /\.back$/ }));
    expect(screen.getByRole("dialog", { name: "Scan items" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /\.next$/ }));
    fireEvent.click(screen.getByRole("button", { name: /\.done$/ }));
    expect(onFinish).toHaveBeenCalledWith("done");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("finishes skipped on Skip and on Escape", () => {
    const onFinish = vi.fn();
    const { unmount } = render(<Tour onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /\.skip$/ }));
    expect(onFinish).toHaveBeenLastCalledWith("skipped");
    unmount();
    render(<Tour onFinish={onFinish} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onFinish).toHaveBeenCalledTimes(2);
    expect(onFinish).toHaveBeenLastCalledWith("skipped");
  });

  it("jumps and does not pulse under reduced motion", () => {
    motionState.reduced = true;
    render(<Tour />);
    expect(cutout()?.style.transition).toBe("none");
    expect(document.querySelectorAll("[data-slot='coach-mark-beacon'] > span")).toHaveLength(1);
  });
});
