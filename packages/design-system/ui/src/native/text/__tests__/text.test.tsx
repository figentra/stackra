/**
 * Stackra file contract:
 * Purpose: proves the native Text hands HeroUI Native Typography.Paragraph the mapped type, colour, alignment and
 *          truncation, adds the theme's `-ar` class for Arabic text (by `lang` or by the screen's locale), and passes
 *          every other prop through unchanged.
 * Boundary: React Native does not render in vitest, so heroui-native and the design-system hook are replaced by
 *          recording stand-ins; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-017 sta-350:FR-019 sta-350:P-010 sta-350:P-011 sta-350:P-012
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { TextTone } from "#contracts/enums/text-tone.enum";
import { TextType } from "#contracts/enums/text-type.enum";
import type { TextContractProps } from "#contracts/types/text-contract-props.type";
import { NATIVE_TONE_CLASS_NAME } from "#core/constants/native-tone-class-name.constant";
import { TYPOGRAPHY_TYPE } from "#core/constants/typography-type.constant";
import { Text } from "#native/text/text";
import type { TextProps } from "#native/text/text.props";

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

describe("Text (native)", () => {
  beforeEach(() => {
    screenLocale.value = "en";
  });

  it("hands Typography.Paragraph the defaults", () => {
    render(<Text>Hello</Text>);
    expect(propsOf()).toEqual({
      children: "Hello",
      type: "body",
      color: "default",
      align: "start",
      truncate: false,
      className: "",
    });
  });

  it.each(TextType)("maps the %s style through TYPOGRAPHY_TYPE", (type) => {
    render(<Text type={type}>Hello</Text>);
    expect(propsOf()["type"]).toBe(TYPOGRAPHY_TYPE[type]);
  });

  it.each(TextTone)("draws the %s tone with HeroUI's colour or the theme's utility", (tone) => {
    render(<Text tone={tone}>Hello</Text>);
    expect(propsOf()["color"]).toBe(tone === "muted" ? "muted" : "default");
    expect(propsOf()["className"]).toBe(NATIVE_TONE_CLASS_NAME[tone]);
  });

  it("puts the caller's class after the tone class", () => {
    render(
      <Text tone="danger" className="mt-2">
        Hello
      </Text>,
    );
    expect(propsOf()["className"]).toBe("!text-danger mt-2");
  });

  it("maps alignment and truncation", () => {
    render(
      <Text align="end" isTruncated>
        Hello
      </Text>,
    );
    expect(propsOf()).toMatchObject({ align: "end", truncate: true });
  });

  it("takes the Arabic style when the screen's locale is Arabic", () => {
    screenLocale.value = "ar";
    render(<Text type="small">مرحبا</Text>);
    expect(propsOf()["className"]).toContain("type-small-ar");
    expect(propsOf()).not.toHaveProperty("accessibilityLanguage");
  });

  it("lets `lang` decide over the screen's locale", () => {
    screenLocale.value = "ar";
    const { unmount } = render(<Text lang="en">Hello</Text>);
    expect(propsOf()["className"]).toBe("");
    expect(propsOf()["accessibilityLanguage"]).toBe("en");
    unmount();

    screenLocale.value = "en";
    render(<Text lang="ar-EG">مرحبا</Text>);
    expect(propsOf()["className"]).toContain("type-body-ar");
    expect(propsOf()["accessibilityLanguage"]).toBe("ar-EG");
  });

  it.each(["he", "fa"])("adds no Arabic style for the screen locale %s", (locale) => {
    screenLocale.value = locale;
    render(<Text>שלום</Text>);
    expect(propsOf()["className"]).toBe("");
  });

  it("passes the other props through unchanged", () => {
    const onPress = vi.fn();
    render(
      <Text
        numberOfLines={2}
        selectable
        testID="found"
        nativeID="intro"
        dynamicTypeRamp="caption1"
        weight="bold"
        onPress={onPress}
      >
        Hello
      </Text>,
    );
    expect(propsOf()).toMatchObject({
      numberOfLines: 2,
      selectable: true,
      testID: "found",
      nativeID: "intro",
      dynamicTypeRamp: "caption1",
      weight: "bold",
    });
    expect(propsOf()["onPress"]).toBe(onPress);
  });

  it("extends its contract and refuses the HeroUI names the contract replaces", () => {
    expectTypeOf<TextProps>().toExtend<TextContractProps>();
    // @ts-expect-error the colour is `tone`
    void (<Text color="muted" />);
    // @ts-expect-error truncation is `isTruncated`
    void (<Text truncate />);
  });
});
