/**
 * Stackra file contract:
 * Purpose: proves the native Heading hands HeroUI Native Typography.Heading the style `type` (default the level's),
 *          adds the theme's `-ar` class for Arabic text, and lets a caller's accessibility role through.
 * Boundary: React Native does not render in vitest, so heroui-native and the design-system hook are replaced by
 *          recording stand-ins; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-019 sta-350:P-010 sta-350:P-011 sta-350:P-012
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { HeadingContractProps } from "#contracts/types/heading-contract-props.type";
import { Heading } from "#native/heading/heading";
import type { HeadingProps } from "#native/heading/heading.props";

const screenLocale = vi.hoisted(() => ({ value: "en" }));
/** The props the last HeroUI Native stand-in was handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: screenLocale.value }),
}));

/** A stand-in for one HeroUI Native text component: it keeps the props it is handed and draws its children. */
function record(name: string) {
  return (props: Record<string, unknown>) => {
    received.props = props;
    return <span data-testid={name}>{props["children"] as ReactNode}</span>;
  };
}

vi.mock("heroui-native", () => {
  return {
    Typography: Object.assign(record("Typography"), {
      Heading: record("Typography.Heading"),
      Paragraph: record("Typography.Paragraph"),
    }),
  };
});

const propsOf = () => received.props;

describe("Heading (native)", () => {
  beforeEach(() => {
    screenLocale.value = "en";
  });

  it.each(HeadingLevel)("level %s draws the matching style", (level) => {
    render(<Heading level={level}>Title</Heading>);
    expect(propsOf()).toMatchObject({ type: `h${level}`, color: "default", align: "start" });
  });

  it("draws a style that differs from the level", () => {
    render(
      <Heading level={1} type="h3">
        Title
      </Heading>,
    );
    expect(propsOf()["type"]).toBe("h3");
  });

  it("takes the Arabic style of its own type when the screen's locale is Arabic", () => {
    screenLocale.value = "ar";
    render(
      <Heading level={1} type="h3">
        عنوان
      </Heading>,
    );
    expect(propsOf()["className"]).toContain("type-h3-ar");
  });

  it("maps tone, truncation and language", () => {
    render(
      <Heading level={2} tone="danger" isTruncated lang="ar">
        عنوان
      </Heading>,
    );
    expect(propsOf()).toMatchObject({
      className: "text-danger type-h2-ar",
      truncate: true,
      accessibilityLanguage: "ar",
    });
  });

  it("lets a caller's accessibility role through, which overrides HeroUI's header role", () => {
    render(
      <Heading level={2} accessibilityRole="link">
        Title
      </Heading>,
    );
    expect(propsOf()["accessibilityRole"]).toBe("link");
  });

  it("extends its contract and requires the level", () => {
    expectTypeOf<HeadingProps>().toExtend<HeadingContractProps>();
    // @ts-expect-error the level is required
    void (<Heading>Title</Heading>);
  });
});
