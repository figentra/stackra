/**
 * Stackra file contract:
 * Purpose: proves the web ImageCropper beyond the first crop: before the image loads the frame is busy, the hint says
 *          it is loading and the zoom slider is off; after, the frame is named (by default "Crop image") and described
 *          by the keyboard hint; every arrow moves the crop the right way (Shift for bigger steps), plus, equals and
 *          minus zoom within 1 and the most zoom, other keys are left alone, a drag moves the crop until released,
 *          and the zoom slider reports a tighter crop. Moving is spatial, so right-to-left does not mirror it.
 * Boundary: jsdom with real HeroUI and React Aria; the image's natural size and the frame's width are set by hand.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 2.5.7 and 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { ImageCrop } from "#contracts/types/image-crop.type";
import { ImageCropper } from "#react/image-cropper/image-cropper";

/** Renders a cropper over a 2000 by 1000 image and loads it. */
function renderLoaded(props: Partial<Parameters<typeof ImageCropper>[0]> = {}) {
  const crops: ImageCrop[] = [];
  const view = render(
    <ImageCropper src="/photo.jpg" onCropChange={(c) => crops.push(c)} {...props} />,
  );
  const image = view.container.querySelector("img");
  if (!image) throw new Error("no image");
  Object.defineProperty(image, "naturalWidth", { value: 2000 });
  Object.defineProperty(image, "naturalHeight", { value: 1000 });
  fireEvent.load(image);
  const frame = screen.getByRole("group", { name: props.label ?? "Crop image" });
  return { ...view, crops, frame, image, last: () => crops.at(-1) };
}

describe("ImageCropper controls (web)", () => {
  it("is busy, says it is loading and keeps the zoom off until the image loads", () => {
    const onCropChange = vi.fn();
    const { container } = render(<ImageCropper src="/photo.jpg" onCropChange={onCropChange} />);
    const frame = screen.getByRole("group", { name: "Crop image" });
    expect(frame.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Loading image")).toBeTruthy();
    expect(
      container.querySelector<HTMLElement>("[data-slot=image-cropper-image]")?.style.opacity,
    ).toBe("0");
    expect(screen.getByRole("slider").hasAttribute("disabled")).toBe(true);
    fireEvent.keyDown(frame, { key: "ArrowLeft" });
    expect(onCropChange).not.toHaveBeenCalled();
  });

  it("is named and described by the keyboard hint once loaded", () => {
    const { frame } = renderLoaded();
    expect(frame.hasAttribute("aria-busy")).toBe(false);
    const hint = document.getElementById(frame.getAttribute("aria-describedby") ?? "");
    expect(hint?.textContent).toBe(
      "Drag the image or use the arrow keys to move it. Plus and minus zoom.",
    );
    expect(screen.getByRole("slider").hasAttribute("disabled")).toBe(false);
  });

  it("moves the crop with each arrow, further with Shift, the same way in right-to-left", () => {
    const { frame, last } = renderLoaded({ label: "Crop your photo" });
    fireEvent.keyDown(frame, { key: "ArrowLeft" });
    expect(last()?.x).toBe(520);
    fireEvent.keyDown(frame, { key: "ArrowLeft", shiftKey: true });
    expect(last()?.x).toBe(620);
    document.documentElement.dir = "rtl";
    try {
      fireEvent.keyDown(frame, { key: "ArrowRight" });
      expect(last()?.x).toBe(600);
    } finally {
      document.documentElement.dir = "";
    }
    // At zoom 1 the picture just fits top to bottom, so up and down cannot open a gap.
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    expect(last()?.y).toBe(0);
    fireEvent.keyDown(frame, { key: "=" });
    fireEvent.keyDown(frame, { key: "ArrowDown" });
    const lower = last()?.y ?? 0;
    fireEvent.keyDown(frame, { key: "ArrowUp" });
    expect(last()?.y).toBeGreaterThan(lower);
  });

  it("zooms within 1 and the most zoom and ignores other keys", () => {
    const { frame, crops, last } = renderLoaded({ maxZoom: 1.2 });
    fireEvent.keyDown(frame, { key: "-" });
    expect(last()?.width).toBe(1000);
    fireEvent.keyDown(frame, { key: "+" });
    fireEvent.keyDown(frame, { key: "+" });
    fireEvent.keyDown(frame, { key: "+" });
    expect(last()?.width).toBe(833);
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("120%");
    const count = crops.length;
    fireEvent.keyDown(frame, { key: "a" });
    expect(crops).toHaveLength(count);
  });

  it("moves the crop while dragged and stops when released", () => {
    const { frame, crops, last } = renderLoaded();
    Object.defineProperty(frame, "clientWidth", { value: 200 });
    frame.setPointerCapture = vi.fn();
    fireEvent.pointerMove(frame, { clientX: 150, clientY: 0 });
    expect(crops).toHaveLength(1);
    fireEvent.pointerDown(frame, { clientX: 100, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 120, clientY: 0 });
    expect(last()?.x).toBe(400);
    fireEvent.pointerUp(frame);
    const count = crops.length;
    fireEvent.pointerMove(frame, { clientX: 180, clientY: 0 });
    expect(crops).toHaveLength(count);
  });

  it("reports a tighter crop from the zoom slider", () => {
    const { last } = renderLoaded();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
    expect(last()?.width).toBe(500);
  });

  it("draws a round frame for an avatar", () => {
    const { frame } = renderLoaded({ shape: "round", aspectRatio: 1 });
    expect(frame.querySelector('[aria-hidden="true"]')?.className).toContain("var(--radius-pill)");
  });
});
