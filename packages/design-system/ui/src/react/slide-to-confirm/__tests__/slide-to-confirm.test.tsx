/**
 * Stackra file contract:
 * Purpose: proves the web SlideToConfirm confirms once from the keyboard, names itself by the confirmed words after,
 *          refuses while disabled, and confirms on a drag past nine tenths of the track (mirrored in RTL) but springs
 *          back from a short or cancelled one, re-measuring the track when it resizes.
 * Boundary: renders the real component in jsdom; jsdom has no layout, so the track width is stubbed, `ResizeObserver`
 *           is a stand-in fired by hand, and pointer capture is a no-op.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { SlideToConfirm } from "#react/slide-to-confirm/slide-to-confirm";

const thumbOf = (track: HTMLElement) =>
  track.querySelector<HTMLElement>('span[style*="translateX"]') as HTMLElement;

describe("SlideToConfirm (web)", () => {
  it("confirms once from the keyboard", () => {
    const onConfirm = vi.fn();
    render(
      <SlideToConfirm label="Slide to charge" confirmedLabel="Charged" onConfirm={onConfirm} />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Slide to charge" }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Charged" }), { key: " " });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("refuses while disabled", () => {
    const onConfirm = vi.fn();
    render(<SlideToConfirm label="Slide" isDisabled onConfirm={onConfirm} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Slide" }), { key: "Enter" });
    expect(onConfirm).not.toHaveBeenCalled();
  });
  describe("dragging", () => {
    let width = 356;
    let resize: (() => void) | undefined;
    beforeEach(() => {
      width = 356;
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get: () => width,
      });
      Element.prototype.setPointerCapture = vi.fn();
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            resize = callback;
          }

          observe() {}

          disconnect() {}
        },
      );
    });
    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
      vi.unstubAllGlobals();
    });

    it("confirms past nine tenths of the track and springs back short of it", () => {
      const onConfirm = vi.fn();
      render(<SlideToConfirm label="Slide" variant="danger" onConfirm={onConfirm} />);
      const track = screen.getByRole("button", { name: "Slide" });
      const thumb = thumbOf(track);
      // The track is 356 wide: 300 of travel once the thumb and padding are taken off.
      fireEvent.pointerMove(thumb, { clientX: 50 });
      expect(thumb.style.transform).toBe("translateX(0px)");
      fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 0 });
      fireEvent.pointerMove(thumb, { clientX: 100 });
      expect(thumb.style.transform).toBe("translateX(100px)");
      fireEvent.pointerUp(thumb);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(thumb.style.transform).toBe("translateX(0px)");
      fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 0 });
      fireEvent.pointerMove(thumb, { clientX: 500 });
      expect(thumb.style.transform).toBe("translateX(300px)");
      fireEvent.pointerCancel(thumb);
      expect(thumb.style.transform).toBe("translateX(0px)");
      fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 0 });
      fireEvent.pointerMove(thumb, { clientX: 280 });
      fireEvent.pointerUp(thumb);
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(track.getAttribute("aria-pressed")).toBe("true");
      // Confirmed, the thumb stays at the end and takes no new drag.
      fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 0 });
      fireEvent.pointerMove(thumb, { clientX: 10 });
      expect(thumb.style.transform).toBe("translateX(300px)");
    });

    it("drags toward the reading end in RTL and re-measures on resize", () => {
      const onConfirm = vi.fn();
      render(
        <I18nProvider locale="ar-SA">
          <SlideToConfirm label="Slide" onConfirm={onConfirm} />
        </I18nProvider>,
      );
      const track = screen.getByRole("button", { name: "Slide" });
      const thumb = thumbOf(track);
      width = 156;
      act(() => resize?.());
      fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 300 });
      fireEvent.pointerMove(thumb, { clientX: 400 });
      expect(thumb.style.transform).toBe("translateX(0px)");
      fireEvent.pointerMove(thumb, { clientX: 200 });
      expect(thumb.style.transform).toBe("translateX(-100px)");
      fireEvent.pointerUp(thumb);
      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it("takes no drag while disabled", () => {
      render(<SlideToConfirm label="Slide" isDisabled />);
      const thumb = thumbOf(screen.getByRole("button", { name: "Slide" }));
      fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 0 });
      fireEvent.pointerMove(thumb, { clientX: 100 });
      expect(thumb.style.transform).toBe("translateX(0px)");
    });
  });
});
