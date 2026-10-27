/**
 * Stackra file contract:
 * Purpose: unit tests of `SharpImageTransformerDriver`: it fits an image inside the box without enlarging it, applies
 *          the EXIF orientation and drops the metadata, composites layers at a position or a gravity, encodes the
 *          asked format, and turns an unreadable image or a layer that does not fit into a `RangeError`.
 * Boundary: test only; runs the real sharp engine on images it makes in memory. No file or network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 3); STA-789.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import sharp from "sharp";

import { ImageTransformer } from "#contracts/ports/image-transformer.port";
import { SharpImageTransformerDriver } from "#node/drivers/sharp-image-transformer.driver";

/** A solid PNG of `width` x `height` in `color`. */
async function png(
  width: number,
  height: number,
  color = { r: 255, g: 255, b: 255, alpha: 1 },
): Promise<Uint8Array> {
  return sharp({ create: { width, height, channels: 4, background: color } })
    .png()
    .toBuffer();
}

const images = new SharpImageTransformerDriver();

describe("SharpImageTransformerDriver", () => {
  it("is a driver of ImageTransformer", () => {
    expect(images).toBeInstanceOf(ImageTransformer);
    expect(kindOf(SharpImageTransformerDriver)).toEqual({
      kind: "driver",
      options: { port: ImageTransformer },
    });
  });

  it("fits inside the box, keeps the aspect ratio and encodes the format", async () => {
    const out = await images.transform(await png(400, 200), { width: 100, format: "webp" });
    expect(await sharp(out).metadata()).toMatchObject({ format: "webp", width: 100, height: 50 });
  });

  it("never enlarges", async () => {
    const out = await images.transform(await png(40, 20), { width: 400, format: "png" });
    expect(await sharp(out).metadata()).toMatchObject({ width: 40, height: 20 });
  });

  it("applies the EXIF orientation and drops the metadata", async () => {
    const rotated = await sharp(await png(40, 20))
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const out = await images.transform(rotated, { format: "jpeg", quality: 80 });
    const meta = await sharp(out).metadata();
    expect(meta).toMatchObject({ width: 20, height: 40 });
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it("composites layers at a position and at a gravity, the last on top", async () => {
    const red = await png(10, 10, { r: 255, g: 0, b: 0, alpha: 1 });
    const blue = await png(10, 10, { r: 0, g: 0, b: 255, alpha: 1 });
    const out = await images.transform(await png(200, 200), {
      width: 100,
      format: "png",
      layers: [
        { bytes: red, left: 0, top: 0 },
        { bytes: blue, gravity: "southeast" },
      ],
    });
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => [
      ...data.subarray(
        (y * info.width + x) * info.channels,
        (y * info.width + x) * info.channels + 3,
      ),
    ];
    expect(info.width).toBe(100);
    expect(pixel(5, 5)).toEqual([255, 0, 0]);
    expect(pixel(95, 95)).toEqual([0, 0, 255]);
    expect(pixel(50, 50)).toEqual([255, 255, 255]);
  });

  it("refuses bytes that are not an image", async () => {
    await expect(
      images.transform(new Uint8Array([1, 2, 3]), { format: "png" }),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("refuses a layer larger than the output", async () => {
    await expect(
      images.transform(await png(20, 20), {
        format: "png",
        layers: [{ bytes: await png(40, 40) }],
      }),
    ).rejects.toBeInstanceOf(RangeError);
  });
});
