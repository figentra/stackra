/**
 * Stackra file contract:
 * Purpose: proves the native Chip hands HeroUI Native the web's defaults (`secondary`, `default`, `md`) instead of
 *          its own, maps `tone` to `color`, wraps text in the label, orders its icons, sizes and colours them through
 *          a Lucide provider to the label, passes the chip's own props through, and refuses `color` and the press
 *          handlers.
 * Boundary: React Native does not render in vitest, so heroui-native and lucide-react-native are replaced by
 *          recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-033 sta-350:FR-035 sta-350:P-019 sta-350:P-023 sta-350:P-025 sta-350:FR-053
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ChipVariant } from "#contracts/enums/chip-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";
import { Chip } from "#native/chip/chip";
import type { ChipProps } from "#native/chip/chip.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Chip: Object.assign(record("chip"), { Label: record("label") }),
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
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

/** The order of the stand-in elements inside the chip's provider. */
const order = (container: HTMLElement) =>
  [...(container.querySelector('[data-testid="provider"]')?.children ?? [])].map(
    (node) => node.getAttribute("data-testid") ?? node.textContent,
  );

// The slot's Icon needs a native runtime: a name draws a marker, an element is drawn as given.
vi.mock("#native/slot-icon/slot-icon", async () => {
  const { createElement } = await import("react");
  return {
    SlotIcon: ({ icon }: { readonly icon?: unknown }) =>
      typeof icon === "string"
        ? createElement("i", { "data-testid": "slot-icon", "data-name": icon })
        : (icon ?? null),
  };
});

/** The icon names the slot stand-in drew, in document order. */
const slotNames = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-testid="slot-icon"]')].map((node) =>
    node.getAttribute("data-name"),
  );

describe("Chip (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("draws an icon name through Icon on either side and an element as given", () => {
    const { container } = render(
      <Chip startIcon="check" endIcon="chevron-right">
        Done
      </Chip>,
    );
    expect(slotNames(container)).toEqual(["check", "chevron-right"]);
    const second = render(<Chip startIcon={<i data-testid="mine" />}>Done</Chip>);
    expect(second.container.querySelector('[data-testid="mine"]')).toBeTruthy();
  });

  it("is a secondary, default, medium chip, not HeroUI Native's filled accent one", () => {
    render(<Chip>Draft</Chip>);
    expect(propsOf("chip")).toMatchObject({ variant: "secondary", color: "default", size: "md" });
  });

  it("hands every variant, tone and size to HeroUI Native, the tone as `color`", () => {
    for (const variant of ChipVariant)
      for (const tone of Tone)
        for (const size of Size) {
          render(
            <Chip variant={variant} tone={tone} size={size}>
              x
            </Chip>,
          );
          expect(propsOf("chip")).toMatchObject({ variant, color: tone, size });
          expect(propsOf("chip")).not.toHaveProperty("tone");
        }
  });

  it("wraps a string or number in the label and leaves other nodes alone", () => {
    const { rerender } = render(<Chip>Draft</Chip>);
    expect(propsOf("label")["children"]).toBe("Draft");
    rerender(<Chip>{3}</Chip>);
    expect(propsOf("label")["children"]).toBe(3);
    received.props = {};
    const { container } = render(
      <Chip>
        <i data-testid="node" />
      </Chip>,
    );
    expect(propsOf("label")).toEqual({});
    expect(container.querySelector('[data-testid="node"]')).toBeTruthy();
  });

  it("draws the start icon, the label and the end icon in that order", () => {
    const { container } = render(
      <Chip startIcon={<i data-testid="start" />} endIcon={<i data-testid="end" />}>
        Next
      </Chip>,
    );
    expect(order(container)).toEqual(["start", "label", "end"]);
  });

  it("sizes icons to the label and colours them like it: solid on primary, soft otherwise", () => {
    const points = { sm: 12, md: 14, lg: 16 } as const;
    for (const variant of ChipVariant)
      for (const tone of Tone)
        for (const size of Size) {
          render(
            <Chip variant={variant} tone={tone} size={size}>
              x
            </Chip>,
          );
          const role = variant === "primary" ? `${tone}-foreground` : `${tone}-soft-foreground`;
          expect(propsOf("provider"), `${variant} ${tone} ${size}`).toMatchObject({
            size: points[size],
            color: `color:${role}`,
          });
        }
  });

  it("passes the chip's own props, the class and the accessibility props through", () => {
    render(
      <Chip
        animation="disable-all"
        background={null}
        className="mine"
        testID="chip"
        hitSlop={4}
        accessibilityHint="Status"
      >
        x
      </Chip>,
    );
    expect(propsOf("chip")).toMatchObject({
      animation: "disable-all",
      background: null,
      className: "mine",
      testID: "chip",
      hitSlop: 4,
      accessibilityHint: "Status",
    });
  });

  it("types: extends the contract and refuses `color` and the press handlers", () => {
    expectTypeOf<ChipProps>().toExtend<ChipContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Chip color="success">x</Chip>);
    // @ts-expect-error a chip is display only: interaction is a TagGroup or a Button
    render(<Chip onPress={() => undefined}>x</Chip>);
    // @ts-expect-error a long press is a press too
    render(<Chip onLongPress={() => undefined}>x</Chip>);
  });
});
