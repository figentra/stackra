/**
 * Stackra file contract:
 * Purpose: proves the native Carousel hands HeroUI Native Pro `label` as `accessibilityLabel`, leaves out what the
 *          caller left out, passes every other prop through, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/carousel subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  Carousel as HeroCarousel,
  useCarousel as heroUseCarousel,
} from "heroui-native-pro/carousel";
import type { ReactNode } from "react";

import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";
import { Carousel, type CarouselProps, useCarousel } from "#native/carousel/carousel";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/carousel", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Carousel: Object.assign(root, {
      Content: part(),
      Item: part(),
      Previous: part(),
      Next: part(),
      NavButtonBackground: part(),
      Dots: part(),
      Thumbnails: part(),
      Thumbnail: part(),
    }),
    useCarousel: () => undefined,
  };
});

describe("Carousel (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to HeroUI Native Pro's accessibilityLabel", () => {
    render(<Carousel label="Featured products" />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Featured products" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<Carousel />);
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    render(
      <Carousel
        label="Featured products"
        itemsPerView={2}
        gap={8}
        type="miniatures"
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      itemsPerView: 2,
      gap: 8,
      type: "miniatures",
      testID: "found",
    });
  });

  it.each([
    "Content",
    "Item",
    "Previous",
    "Next",
    "NavButtonBackground",
    "Dots",
    "Thumbnails",
    "Thumbnail",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Carousel[name]).toBe(HeroCarousel[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useCarousel).toBe(heroUseCarousel);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<CarouselProps>().toExtend<CarouselContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<Carousel accessibilityLabel="x" />);
  });
});
