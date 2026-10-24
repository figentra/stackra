/**
 * Stackra file contract:
 * Purpose: proves the native Avatar hands HeroUI Native the size, variant and the tone as `color` (defaulting to
 *          `default`, not `accent`), hides itself unless labelled and then never lets HeroUI's English "Avatar"
 *          through, draws the image only for a non-empty `src`, falls back from the node to the initials to the person
 *          icon in the soft foreground, squares both the root and the fallback, passes the root's own props through,
 *          and refuses `color`, `children`, `alt` and the raw accessibility props.
 * Boundary: React Native does not render in vitest, so heroui-native, lucide-react-native and the Icon are replaced
 *          by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-043 sta-350:P-031 sta-350:P-034
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { AvatarVariant } from "#contracts/enums/avatar-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { AvatarContractProps } from "#contracts/types/avatar-contract-props.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { Avatar, type AvatarProps } from "#native/avatar/avatar";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Avatar: Object.assign(record("avatar"), {
      Image: record("image"),
      Fallback: record("fallback"),
    }),
    cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
    useThemeColor: (name: string) => `color:${name}`,
  };
});

vi.mock("lucide-react-native", async () => {
  const { createElement } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) => {
      received.props["provider"] = props;
      return createElement("div", { "data-testid": "provider" }, props["children"] as ReactNode);
    },
    UserRound: "UserRound",
  };
});

vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) => {
      received.props["icon"] = props;
      return createElement("div", { "data-testid": "icon" });
    },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));

const propsOf = (name: string) => received.props[name] ?? {};
const onLayout = () => undefined;

describe("Avatar (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native the size and variant, and the tone as `color`, defaulting to `default`", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(propsOf("avatar")).toMatchObject({ color: "default" });
    for (const variant of AvatarVariant)
      for (const tone of Tone)
        for (const size of Size) {
          render(<Avatar variant={variant} tone={tone} size={size} />);
          expect(propsOf("avatar")).toMatchObject({ variant, color: tone, size });
          expect(propsOf("avatar")).not.toHaveProperty("tone");
        }
  });

  it("is hidden from VoiceOver and TalkBack without a label, or with an empty one", () => {
    for (const props of [{}, { label: "" }]) {
      render(<Avatar {...props} />);
      expect(propsOf("avatar")).toMatchObject({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
        alt: "",
      });
      expect(propsOf("avatar")).not.toHaveProperty("accessibilityLabel");
      expect(propsOf("avatar")).not.toHaveProperty("role");
    }
  });

  it("is one image named by its label, so HeroUI's English default never reaches the tree", () => {
    render(<Avatar label="Ada Lovelace" />);
    expect(propsOf("avatar")).toMatchObject({
      accessible: true,
      role: "img",
      accessibilityLabel: "Ada Lovelace",
      alt: "Ada Lovelace",
    });
    expect(propsOf("avatar")).not.toHaveProperty("accessibilityElementsHidden");
  });

  it("draws the image only for a non-empty `src`", () => {
    const { queryByTestId, rerender } = render(<Avatar src="https://example.test/a.png" />);
    expect(propsOf("image")).toMatchObject({ source: { uri: "https://example.test/a.png" } });
    rerender(<Avatar src="" />);
    expect(queryByTestId("image")).toBeNull();
    rerender(<Avatar />);
    expect(queryByTestId("image")).toBeNull();
  });

  it("draws a string or number fallback bare, never inside the provider", () => {
    const { getByTestId, rerender } = render(<Avatar name="Ada Lovelace" fallback="?" />);
    expect(getByTestId("fallback").textContent).toBe("?");
    expect(getByTestId("fallback").querySelector('[data-testid="provider"]')).toBeNull();
    rerender(<Avatar fallback={7} />);
    expect(getByTestId("fallback").textContent).toBe("7");
    expect(getByTestId("fallback").querySelector('[data-testid="provider"]')).toBeNull();
  });

  it("falls back from the node to the initials to the person icon", () => {
    const { getByTestId, rerender } = render(
      <Avatar name="Ada Lovelace" fallback={<b data-testid="mine" />} />,
    );
    expect(getByTestId("mine")).toBeTruthy();
    rerender(<Avatar name="Ada Lovelace" />);
    expect(getByTestId("fallback").textContent).toBe("AL");
    expect(getByTestId("fallback").querySelector('[data-testid="provider"]')).toBeNull();
    rerender(<Avatar size="lg" />);
    expect(propsOf("icon")).toMatchObject({ name: "user-round", size: "lg" });
    rerender(<Avatar name="   " />);
    expect(propsOf("icon")).toMatchObject({ name: "user-round", size: "md" });
  });

  it("sizes and colours a fallback icon through the Lucide provider, in the tone's soft foreground", () => {
    for (const tone of Tone)
      for (const size of Size) {
        render(<Avatar tone={tone} size={size} />);
        expect(propsOf("provider")).toEqual({
          size: ICON_SIZES[size],
          color: `color:${tone}-soft-foreground`,
          children: expect.anything(),
        });
      }
  });

  it("squares the root and the fallback, keeping the caller's class", () => {
    const { rerender } = render(<Avatar shape="square" className="mine" />);
    expect(propsOf("avatar")["className"]).toBe("rounded-lg mine");
    expect(propsOf("fallback")["className"]).toBe("rounded-lg");
    rerender(<Avatar className="mine" />);
    expect(propsOf("avatar")["className"]).toBe("mine");
    expect(propsOf("fallback")).not.toHaveProperty("className");
  });

  it("passes the root's own props through", () => {
    render(
      <Avatar
        animation="disable-all"
        background={null}
        testID="a"
        style={{ opacity: 0.5 }}
        onLayout={onLayout}
      />,
    );
    expect(propsOf("avatar")).toMatchObject({
      animation: "disable-all",
      background: null,
      testID: "a",
      style: { opacity: 0.5 },
      onLayout,
    });
  });

  it("types: extends the contract and refuses `color`, `children`, `alt` and raw accessibility props", () => {
    expectTypeOf<AvatarProps>().toExtend<AvatarContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Avatar color="success" />);
    // @ts-expect-error the wrapper builds the children
    render(<Avatar>x</Avatar>);
    // @ts-expect-error the accessible name is `label`
    render(<Avatar alt="x" />);
    // @ts-expect-error the accessible name is `label`
    render(<Avatar accessibilityLabel="x" />);
    // @ts-expect-error `label` decides whether it is accessible
    render(<Avatar accessible />);
    // @ts-expect-error `label` decides whether it is hidden
    render(<Avatar importantForAccessibility="no" />);
  });
});
