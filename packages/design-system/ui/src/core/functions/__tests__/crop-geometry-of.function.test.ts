/**
 * Stackra file contract:
 * Purpose: proves `cropGeometryOf` covers the frame at zoom 1, keeps the centre, clamps the offset so no gap opens,
 *          and shrinks the kept rectangle as the zoom grows.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { cropGeometryOf } from "#core/functions/crop-geometry-of.function";

describe("cropGeometryOf", () => {
  it("keeps the centred square of a landscape image at zoom 1", () => {
    const geometry = cropGeometryOf({ width: 2000, height: 1000 }, 1, 1, { x: 0, y: 0 });
    expect(geometry.width).toBeCloseTo(2);
    expect(geometry.height).toBeCloseTo(1);
    expect(geometry.crop).toEqual({ x: 500, y: 0, width: 1000, height: 1000 });
  });

  it("clamps the offset so the image still covers the frame", () => {
    const geometry = cropGeometryOf({ width: 2000, height: 1000 }, 1, 1, { x: 5, y: 5 });
    expect(geometry.offset).toEqual({ x: 0.5, y: 0 });
    expect(geometry.left).toBeCloseTo(0);
    expect(geometry.crop.x).toBe(0);
  });

  it("keeps a smaller rectangle as the zoom grows, in a wide frame", () => {
    const geometry = cropGeometryOf({ width: 1600, height: 900 }, 16 / 9, 2, { x: 0, y: 0 });
    expect(geometry.crop).toEqual({ x: 400, y: 225, width: 800, height: 450 });
  });
});
