/**
 * Stackra file contract:
 * Purpose: proves the native Popover hands HeroUI Native's root the open state under its own names (`isDefaultOpen`),
 *          wraps the trigger as a pressable child, closes on a press outside unless `isDismissable` is false, turns
 *          `start` and `end` into physical sides by the screen's direction, defaults to `bottom` and `center`, draws
 *          the arrow with the border it needs, titles the content, wraps plain text in `Text`, ignores the Escape flag
 *          and passes the content's own props through, and that the type refuses a physical side and a missing trigger.
 * Boundary: React Native does not render in vitest, so heroui-native, the provider's hook and `Text` are replaced by
 *           recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not where it draws.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0060 (right-to-left); ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-110
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { PopoverContractProps } from "#contracts/types/popover-contract-props.type";
import { Popover } from "#native/popover/popover";
import type { PopoverProps } from "#native/popover/popover.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  direction: "ltr" as "ltr" | "rtl",
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Popover: Object.assign(record("root"), {
      Trigger: record("trigger"),
      Portal: record("portal"),
      Overlay: record("overlay"),
      Content: record("content"),
      Arrow: record("arrow"),
      Title: record("title"),
    }),
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ direction: received.direction }),
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: ({ children }: { readonly children?: ReactNode }) =>
      createElement("span", { "data-testid": "text" }, children),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const trigger = <button type="button">Filters</button>;

describe("Popover (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.direction = "ltr";
  });

  it("hands the root the open state, the default open state under HeroUI Native's name", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover trigger={trigger} isOpen defaultOpen onOpenChange={onOpenChange}>
        x
      </Popover>,
    );
    expect(propsOf("root")).toMatchObject({ isOpen: true, isDefaultOpen: true, onOpenChange });
    expect(propsOf("root")).not.toHaveProperty("defaultOpen");
  });

  it("leaves the open state out of the root when not given", () => {
    render(<Popover trigger={trigger}>x</Popover>);
    expect(propsOf("root")).not.toHaveProperty("isOpen");
    expect(propsOf("root")).not.toHaveProperty("isDefaultOpen");
  });

  it("wraps the trigger as a pressable child and draws the content floating", () => {
    const { getByText } = render(<Popover trigger={trigger}>x</Popover>);
    expect(propsOf("trigger")).toMatchObject({ asChild: true });
    expect(getByText("Filters")).toBeTruthy();
    expect(propsOf("content")).toMatchObject({ presentation: "popover" });
  });

  it("closes on a press outside, unless it is not dismissable", () => {
    render(<Popover trigger={trigger}>x</Popover>);
    expect(propsOf("overlay")).toMatchObject({ closeOnPress: true });
    render(
      <Popover trigger={trigger} isDismissable={false}>
        x
      </Popover>,
    );
    expect(propsOf("overlay")).toMatchObject({ closeOnPress: false });
  });

  it("defaults to the bottom, centred", () => {
    render(<Popover trigger={trigger}>x</Popover>);
    expect(propsOf("content")).toMatchObject({ placement: "bottom", align: "center" });
  });

  it("turns start and end into physical sides by the screen's direction", () => {
    render(
      <Popover trigger={trigger} placement="end" align="start">
        x
      </Popover>,
    );
    expect(propsOf("content")).toMatchObject({ placement: "right", align: "start" });
    received.direction = "rtl";
    render(
      <Popover trigger={trigger} placement="end">
        x
      </Popover>,
    );
    expect(propsOf("content")).toMatchObject({ placement: "left" });
    render(
      <Popover trigger={trigger} placement="top">
        x
      </Popover>,
    );
    expect(propsOf("content")).toMatchObject({ placement: "top" });
  });

  it("draws the arrow with the border it needs, only when asked", () => {
    const { queryByTestId, rerender } = render(<Popover trigger={trigger}>x</Popover>);
    expect(queryByTestId("arrow")).toBeNull();
    expect(propsOf("content")["className"]).toBe("");
    rerender(
      <Popover trigger={trigger} hasArrow className="w-72">
        x
      </Popover>,
    );
    expect(queryByTestId("arrow")).toBeTruthy();
    expect(propsOf("content")["className"]).toBe("border border-border w-72");
  });

  it("titles the content and wraps plain text in Text, leaving elements as given", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <Popover trigger={trigger} title="Filter orders">
        Choose a status.
      </Popover>,
    );
    expect(getByTestId("title").textContent).toBe("Filter orders");
    expect(getByTestId("text").textContent).toBe("Choose a status.");
    rerender(
      <Popover trigger={trigger}>
        <i data-testid="mine" />
      </Popover>,
    );
    expect(queryByTestId("title")).toBeNull();
    expect(queryByTestId("text")).toBeNull();
    expect(getByTestId("mine")).toBeTruthy();
  });

  it("reads no Escape flag and passes the content's own props through", () => {
    render(
      <Popover trigger={trigger} isKeyboardDismissDisabled width={320} offset={8}>
        x
      </Popover>,
    );
    expect(propsOf("content")).toMatchObject({ width: 320, offset: 8 });
    expect(propsOf("content")).not.toHaveProperty("isKeyboardDismissDisabled");
  });

  it("refuses a physical side and a missing trigger", () => {
    expectTypeOf<PopoverProps>().toExtend<PopoverContractProps>();
    // @ts-expect-error placement is by reading direction, so `left` is not a side
    const wrongSide: PopoverProps["placement"] = "left";
    // @ts-expect-error a popover has to be opened by something
    const noTrigger: PopoverProps = { children: "x" };
    void [wrongSide, noTrigger];
  });
});
