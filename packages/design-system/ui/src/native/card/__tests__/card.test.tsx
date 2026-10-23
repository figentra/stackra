/**
 * Stackra file contract:
 * Purpose: proves the native Card hands HeroUI Native the level and the surface props unchanged, renders the contract's
 *          `Card.Content` as HeroUI Native's body, uses HeroUI Native's header, description and footer as they are,
 *          announces the title as a heading unless the caller says otherwise, drops `level`, and exposes no
 *          `Card.Body`.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-029 sta-350:FR-031 sta-350:P-019 sta-350:P-020 sta-350:P-021
import { render } from "@testing-library/react";
import { Card as HeroCard } from "heroui-native";
import type { ReactNode } from "react";

import { HeadingLevel } from "#contracts/enums/heading-level.enum";
import { SurfaceVariant } from "#contracts/enums/surface-variant.enum";
import type { CardContractProps } from "#contracts/types/card-contract-props.type";
import type { CardTitleContractProps } from "#contracts/types/card-title-contract-props.type";
import { Card, type CardProps } from "#native/card/card";
import type { CardTitleProps } from "#native/card/card-title";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Card: Object.assign(record("card"), {
      Header: record("card-header"),
      Body: record("card-body"),
      Title: record("card-title"),
      Description: record("card-description"),
      Footer: record("card-footer"),
    }),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("Card (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(SurfaceVariant)(
    "hands the %s level and the surface props to HeroUI Native",
    (variant) => {
      render(
        <Card variant={variant} background={null} animation="disable-all" testID="c">
          x
        </Card>,
      );
      expect(propsOf("card")).toMatchObject({
        variant,
        background: null,
        animation: "disable-all",
        testID: "c",
      });
    },
  );

  it("renders `Card.Content` as HeroUI Native's body and keeps its other parts as they are", () => {
    const { getByTestId } = render(
      <Card>
        <Card.Header>h</Card.Header>
        <Card.Content>c</Card.Content>
        <Card.Footer>f</Card.Footer>
      </Card>,
    );
    expect(getByTestId("card-body").textContent).toBe("c");
    expect(Card.Header).toBe(HeroCard.Header);
    expect(Card.Description).toBe(HeroCard.Description);
    expect(Card.Footer).toBe(HeroCard.Footer);
  });

  it("announces the title as a heading, and a caller's role wins", () => {
    const { rerender } = render(<Card.Title>Title</Card.Title>);
    expect(propsOf("card-title")["accessibilityRole"]).toBe("header");
    rerender(<Card.Title accessibilityRole="text">Title</Card.Title>);
    expect(propsOf("card-title")["accessibilityRole"]).toBe("text");
  });

  it.each(HeadingLevel)("never hands level %s to the title", (level) => {
    render(
      <Card.Title level={level} numberOfLines={1}>
        Title
      </Card.Title>,
    );
    expect(propsOf("card-title")).not.toHaveProperty("level");
    expect(propsOf("card-title")["numberOfLines"]).toBe(1);
  });

  it("types: extends the contracts and has no `Card.Body`", () => {
    expectTypeOf<CardProps>().toExtend<CardContractProps>();
    expectTypeOf<CardTitleProps>().toExtend<CardTitleContractProps>();
    // @ts-expect-error the body is `Card.Content` on both runtimes; HeroUI Native's own name is not part of the contract
    expect(Card.Body).toBeUndefined();
  });
});
