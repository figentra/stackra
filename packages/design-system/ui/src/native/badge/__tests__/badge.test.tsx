/**
 * Stackra file contract:
 * Purpose: proves the native Badge hands HeroUI Native's Chip the tone (defaulting to `default`, not the chip's
 *          `accent`), variant and size, adds the web Badge's size classes, pins itself to a corner with React Native's
 *          logical sides, is hidden from screen readers unless labelled, never takes a press, passes the chip's own
 *          props through, and has a relative anchor.
 * Boundary: React Native does not render in vitest, so heroui-native and react-native are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering or the corner it
 *          draws on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0304; ADR 0060 (right-to-left); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-037 sta-350:FR-039 sta-350:P-019 sta-350:P-026 sta-350:P-027 sta-350:P-028 sta-350:P-029
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { BadgePlacement } from "#contracts/enums/badge-placement.enum";
import { BadgeVariant } from "#contracts/enums/badge-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";
import { Badge } from "#native/badge/badge";
import type { BadgeProps } from "#native/badge/badge.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Chip: Object.assign(record("chip"), { Label: record("chip-label") }),
    cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props["view"] = props;
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

/** The size classes and offsets the badge is expected to use, copied from the web Badge's CSS. */
const ROOT_CLASS = {
  sm: "min-h-4 min-w-4 px-0 py-0 rounded-xl border border-background",
  md: "min-h-7 min-w-7 px-0 py-0 rounded-3xl border border-background",
  lg: "min-h-8 min-w-8 px-0 py-0 rounded-2xl border border-background",
} as const;
const LABEL_CLASS = {
  sm: "px-0.5 text-[10px] leading-[1.34]",
  md: "px-0.5 text-xs leading-[1.34]",
  lg: "px-0.5 text-sm leading-[1.43]",
} as const;
const OFFSET = { sm: 4, md: 7, lg: 8 } as const;

describe("Badge (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("is a primary, default, medium badge, not HeroUI Native's accent chip", () => {
    render(<Badge>5</Badge>);
    expect(propsOf("chip")).toMatchObject({ variant: "primary", color: "default", size: "md" });
  });

  it("hands every variant, tone and size to HeroUI Native, the tone as `color`", () => {
    for (const variant of BadgeVariant)
      for (const tone of Tone)
        for (const size of Size) {
          render(
            <Badge variant={variant} tone={tone} size={size}>
              5
            </Badge>,
          );
          expect(propsOf("chip")).toMatchObject({ variant, color: tone, size });
          expect(propsOf("chip")).not.toHaveProperty("tone");
        }
  });

  it("wraps text and numbers in the label with the size's classes, and leaves elements and dots alone", () => {
    for (const size of Size) {
      render(<Badge size={size}>New</Badge>);
      expect(propsOf("chip-label")).toMatchObject({
        children: "New",
        className: LABEL_CLASS[size],
      });
    }
    render(<Badge>{5}</Badge>);
    expect(propsOf("chip-label")["children"]).toBe(5);
    received.props = {};
    render(
      <Badge>
        <i data-testid="icon" />
      </Badge>,
    );
    expect(propsOf("chip-label")).toEqual({});
    received.props = {};
    render(<Badge />);
    expect(propsOf("chip-label")).toEqual({});
  });

  it("gives the chip the size's root classes and the caller's class after them", () => {
    for (const size of Size) {
      render(
        <Badge size={size} className="ms-1">
          5
        </Badge>,
      );
      expect(propsOf("chip")["className"]).toBe(`${ROOT_CLASS[size]} ms-1`);
    }
  });

  it("pins each corner with logical sides and the size's offset, never left or right", () => {
    for (const placement of BadgePlacement)
      for (const size of Size) {
        render(
          <Badge placement={placement} size={size} style={{ opacity: 0.5 }}>
            5
          </Badge>,
        );
        const block = placement.startsWith("top") ? "top" : "bottom";
        const side = placement.endsWith("end") ? "end" : "start";
        const style = propsOf("chip")["style"] as Record<string, unknown>[];
        expect(style[0], `${placement} ${size}`).toEqual({
          position: "absolute",
          [block]: -OFFSET[size],
          [side]: -OFFSET[size],
        });
        expect(style[0]).not.toHaveProperty("left");
        expect(style[0]).not.toHaveProperty("right");
        expect(style[1]).toEqual({ opacity: 0.5 });
      }
  });

  it("sits top-end by default", () => {
    render(<Badge>5</Badge>);
    const style = propsOf("chip")["style"] as Record<string, unknown>[];
    expect(style[0]).toEqual({ position: "absolute", top: -7, end: -7 });
  });

  it("is hidden from screen readers without a label", () => {
    render(<Badge>5</Badge>);
    expect(propsOf("chip")).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  it("is one text element named by its label, with nothing hidden, when labelled", () => {
    render(<Badge label="3 unread">3</Badge>);
    expect(propsOf("chip")).toMatchObject({
      accessible: true,
      accessibilityRole: "text",
      accessibilityLabel: "3 unread",
    });
    expect(propsOf("chip")).not.toHaveProperty("accessibilityElementsHidden");
    expect(propsOf("chip")).not.toHaveProperty("importantForAccessibility");
  });

  it("lets presses through to the anchor", () => {
    render(<Badge>5</Badge>);
    expect(propsOf("chip")["pointerEvents"]).toBe("none");
  });

  it("passes the chip's own props through", () => {
    render(
      <Badge testID="b" nativeID="n" animation="disable-all" background={null}>
        5
      </Badge>,
    );
    expect(propsOf("chip")).toMatchObject({
      testID: "b",
      nativeID: "n",
      animation: "disable-all",
      background: null,
    });
  });

  it("anchors the badge in a relative view that shrinks to its content", () => {
    const { getByTestId } = render(
      <Badge.Anchor className="mine" testID="a">
        <i data-testid="anchored" />
      </Badge.Anchor>,
    );
    expect(propsOf("view")).toMatchObject({ className: "relative self-start mine", testID: "a" });
    expect(getByTestId("anchored")).toBeTruthy();
  });

  it("types: extends the contract and refuses presses, `color`, the name props and a style function", () => {
    expectTypeOf<BadgeProps>().toExtend<BadgeContractProps>();
    // @ts-expect-error a badge takes no press
    render(<Badge onPress={() => undefined}>5</Badge>);
    // @ts-expect-error the colour role is `tone`
    render(<Badge color="danger">5</Badge>);
    // @ts-expect-error the accessible name is `label`
    render(<Badge accessibilityLabel="Unread">5</Badge>);
    // @ts-expect-error the wrapper composes `style` as an array, so a press-state function is not taken
    render(<Badge style={() => ({})}>5</Badge>);
  });
});
