/**
 * Stackra file contract:
 * Purpose: proves the native Barcode is one image named by its value, held left to right, with its bars in an SVG
 *          path and the digits in platform Text, and shows the error line for an invalid value.
 * Boundary: React Native and react-native-svg are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Barcode } from "#native/barcode/barcode";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[], paths: [] as string[] }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
    Text: ({ children }: Record<string, unknown>) => createElement("span", null, children as never),
  };
});
vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ children }: Record<string, unknown>) =>
      createElement("svg", null, children as never),
    Path: ({ d }: { d: string }) => {
      state.paths.push(d);
      return null;
    },
  };
});

describe("Barcode (native)", () => {
  beforeEach(() => {
    state.views = [];
    state.paths = [];
  });

  it("draws an EAN-13 image named by its full number, left to right", () => {
    render(<Barcode value="590123412345" format="ean13" />);
    expect(state.views[0]).toMatchObject({
      accessibilityRole: "image",
      accessibilityLabel: "5901234123457",
      style: { direction: "ltr" },
    });
    expect(state.paths[0]).toMatch(/^M10 0h1v64h-1z/);
    expect(screen.getByText("5901234123457")).toBeTruthy();
  });

  it("shows the error line for an invalid value", () => {
    render(<Barcode value="abaya é" />);
    expect(state.paths).toHaveLength(0);
    expect(screen.getByText("This barcode can't be drawn: check the value.")).toBeTruthy();
  });
});
