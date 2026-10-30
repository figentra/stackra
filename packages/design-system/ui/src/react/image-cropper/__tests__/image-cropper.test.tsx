/**
 * Stackra file contract:
 * Purpose: proves the web ImageCropper reports the centred crop once the image loads, moves it with the arrow keys
 *          and shrinks it with the plus key, within the image.
 * Boundary: jsdom; the image's natural size is set by hand, since jsdom loads no pictures.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { ImageCrop } from "#contracts/types/image-crop.type";
import { ImageCropper } from "#react/image-cropper/image-cropper";

describe("ImageCropper (web)", () => {
  it("reports the crop on load, on the arrow keys and on zoom", () => {
    const crops: ImageCrop[] = [];
    const { container } = render(
      <ImageCropper src="/photo.jpg" label="Crop your photo" onCropChange={(c) => crops.push(c)} />,
    );
    const image = container.querySelector("img");
    if (!image) throw new Error("no image");
    Object.defineProperty(image, "naturalWidth", { value: 2000 });
    Object.defineProperty(image, "naturalHeight", { value: 1000 });
    fireEvent.load(image);
    expect(crops.at(-1)).toEqual({ x: 500, y: 0, width: 1000, height: 1000 });

    const frame = screen.getByRole("group", { name: "Crop your photo" });
    fireEvent.keyDown(frame, { key: "ArrowRight" });
    expect(crops.at(-1)?.x).toBe(480);
    fireEvent.keyDown(frame, { key: "+" });
    expect(crops.at(-1)?.width).toBe(909);
  });
});
