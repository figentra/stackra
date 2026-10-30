/**
 * Stackra file contract:
 * Purpose: proves the web `UndoCountdown`: a decorative ring that drains once over the toast's duration, pauses while
 *          the pointer or focus is in the toast region, resumes when both leave, stops when unmounted, and stays full
 *          at the `none` motion level or where the Web Animations API is missing.
 * Boundary: jsdom has no Web Animations API, so `Element.prototype.animate` is a stand-in and the motion level is mocked.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion); WCAG 2.2 SC 2.2.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";

import { UndoCountdown } from "#react/toast/undo-countdown";

const level = vi.hoisted(() => ({ motion: "full" }));
vi.mock("#react/design-system-provider/use-motion", () => ({ useMotion: () => level.motion }));

const drain = { pause: vi.fn(), play: vi.fn(), cancel: vi.fn() };
const animate = vi.fn(() => drain);

/** The countdown inside a toast region. */
const renderInRegion = () => {
  const view = render(
    <div data-slot="toast-region">
      <UndoCountdown duration={5000} />
    </div>,
  );
  const region = view.container.querySelector<HTMLElement>("[data-slot='toast-region']");
  if (!region) throw new Error("no region");
  return { ...view, region };
};

describe("UndoCountdown (web)", () => {
  beforeEach(() => {
    level.motion = "full";
    vi.clearAllMocks();
    Object.defineProperty(Element.prototype, "animate", {
      value: animate,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate;
  });

  it("is hidden from assistive technology and drains the ring once over the duration", () => {
    const { container } = renderInRegion();
    expect(container.querySelector("span")?.getAttribute("aria-hidden")).toBe("true");
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledWith(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: 2 * Math.PI * 10 }],
      expect.objectContaining({ duration: 5000, easing: "linear", fill: "forwards" }),
    );
  });

  it("pauses while the pointer or focus is in the region and resumes when they leave", () => {
    const { region } = renderInRegion();
    fireEvent.pointerEnter(region);
    expect(drain.pause).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(region);
    expect(drain.play).toHaveBeenCalledTimes(1);
    fireEvent.focusIn(region);
    expect(drain.pause).toHaveBeenCalledTimes(2);
    fireEvent.focusOut(region);
    expect(drain.play).toHaveBeenCalledTimes(2);
  });

  it("stays paused when the pointer leaves while focus is still inside", () => {
    const { region } = renderInRegion();
    const button = document.createElement("button");
    region.append(button);
    button.focus();
    fireEvent.pointerLeave(region);
    expect(drain.play).not.toHaveBeenCalled();
  });

  it("cancels the drain and stops listening when unmounted", () => {
    const { region, unmount } = renderInRegion();
    unmount();
    expect(drain.cancel).toHaveBeenCalledTimes(1);
    fireEvent.pointerEnter(region);
    expect(drain.pause).not.toHaveBeenCalled();
  });

  it("stays full at the none motion level", () => {
    level.motion = "none";
    renderInRegion();
    expect(animate).not.toHaveBeenCalled();
  });

  it("stays full where the Web Animations API is missing", () => {
    delete (Element.prototype as { animate?: unknown }).animate;
    expect(() => renderInRegion()).not.toThrow();
    expect(animate).not.toHaveBeenCalled();
  });

  it("still drains outside a toast region", () => {
    render(<UndoCountdown duration={3000} />);
    expect(animate).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ duration: 3000 }),
    );
  });
});
