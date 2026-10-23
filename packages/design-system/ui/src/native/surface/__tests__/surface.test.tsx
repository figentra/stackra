/**
 * Stackra file contract:
 * Purpose: proves the native Surface hands HeroUI Native every surface level unchanged, passes the surface's own
 *          props (`animation`, `asChild`, `background`) and the view and accessibility props through, and keeps its
 *          level names equal to HeroUI Native's.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-029 sta-350:FR-031 sta-350:P-019 sta-350:P-021
import { render } from "@testing-library/react";
import type { SurfaceVariant as HeroSurfaceVariant } from "heroui-native";
import type { ReactNode } from "react";

import { SurfaceVariant } from "#contracts/enums/surface-variant.enum";
import type { SurfaceContractProps } from "#contracts/types/surface-contract-props.type";
import { Surface, type SurfaceProps } from "#native/surface/surface";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return { Surface: record("surface") };
});

const surfaceProps = () => received.props["surface"] ?? {};

describe("Surface (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(SurfaceVariant)("hands the %s level to HeroUI Native unchanged", (variant) => {
    render(<Surface variant={variant}>x</Surface>);
    expect(surfaceProps()["variant"]).toBe(variant);
  });

  it("leaves the level to HeroUI Native's default when none is given", () => {
    render(<Surface>x</Surface>);
    expect(surfaceProps()).not.toHaveProperty("variant");
  });

  it("passes the surface's own props and the view and accessibility props through", () => {
    render(
      <Surface
        animation="disable-all"
        asChild
        background={null}
        className="p-0"
        testID="s"
        accessibilityLabel="Panel"
      >
        x
      </Surface>,
    );
    expect(surfaceProps()).toMatchObject({
      animation: "disable-all",
      asChild: true,
      background: null,
      className: "p-0",
      testID: "s",
      accessibilityLabel: "Panel",
    });
  });

  it("types: extends the contract and takes exactly HeroUI Native's levels", () => {
    expectTypeOf<SurfaceProps>().toExtend<SurfaceContractProps>();
    expectTypeOf<SurfaceVariant>().toEqualTypeOf<HeroSurfaceVariant>();
    // @ts-expect-error `primary` is not a surface level
    render(<Surface variant="primary">x</Surface>);
  });
});
