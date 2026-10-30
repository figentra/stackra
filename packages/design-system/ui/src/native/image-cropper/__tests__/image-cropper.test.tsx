/**
 * Stackra file contract:
 * Purpose: proves the native ImageCropper reads the image size, reports the centred crop, is one adjustable element
 *          whose increment action zooms in, and moves the image with a pan.
 * Boundary: React Native and the Slider are recording stand-ins; the PanResponder's config is captured and driven.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import type { ImageCrop } from "#contracts/types/image-crop.type";
import { ImageCropper } from "#native/image-cropper/image-cropper";

const state = vi.hoisted(() => ({
  frame: {} as Record<string, unknown>,
  pan: {} as Record<string, (...args: unknown[]) => void>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "adjustable") state.frame = props;
      return createElement("div", null, props["children"] as never);
    },
    Text: ({ children }: Record<string, unknown>) => createElement("span", null, children as never),
    Image: Object.assign(() => null, {
      getSize: (_: string, done: (w: number, h: number) => void) => done(2000, 1000),
    }),
    PanResponder: {
      create: (config: Record<string, (...args: unknown[]) => void>) => {
        state.pan = config;
        return { panHandlers: {} };
      },
    },
  };
});
vi.mock("#native/slider/slider", () => ({ Slider: () => null }));

describe("ImageCropper (native)", () => {
  it("reports the crop on load, on zoom and on a pan", () => {
    const crops: ImageCrop[] = [];
    render(<ImageCropper src="/photo.jpg" onCropChange={(c) => crops.push(c)} />);
    expect(crops.at(-1)).toEqual({ x: 500, y: 0, width: 1000, height: 1000 });
    expect(state.frame["accessibilityLabel"]).toBe("Crop image");

    act(() => {
      (state.frame["onAccessibilityAction"] as (e: unknown) => void)({
        nativeEvent: { actionName: "increment" },
      });
    });
    expect(crops.at(-1)?.width).toBe(800);

    act(() => {
      (state.frame["onLayout"] as (e: unknown) => void)({
        nativeEvent: { layout: { width: 200 } },
      });
    });
    act(() => {
      state.pan["onPanResponderGrant"]?.();
      state.pan["onPanResponderMove"]?.({}, { dx: 20, dy: 0 });
    });
    expect(crops.at(-1)?.x).toBeLessThan(600);
  });
});
